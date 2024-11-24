// IMPORTS
import express from 'express';
import Docker from 'dockerode';

// CONSTANTS
const PORT = process.env.PORT || 3000;
const DEFAULT_IMAGE = 'ubuntu:latest';
const CODE_SERVER_PORT = '8080/tcp';

// EXPRESS CONFIG
const app = express();
app.set('view engine', 'ejs');
app.use('/public', express.static('public'));
app.use(express.json());

// DOCKER CONFIG
const docker = new Docker();

// UTILITY FUNCTIONS
async function pullImage(imageName) {
    console.log(`Pulling Docker Image: ${imageName}`);
    
    try {
        return await new Promise((resolve, reject) => {
            docker.pull(imageName, (err, stream) => {
                if (err) return reject(err);

                docker.modem.followProgress(stream, (err, output) => {
                    if (err) return reject(err);
                    
                    console.log(`Successfully Pulled Docker Image: ${imageName}`);
                    resolve(output);
                });
            });
        });
    } catch (error) {
        console.error(`Failed to pull image ${imageName}:`, error);
        throw error;
    }
}

async function createCodespaceContainer(containerName, volumeName) {
    try {
        // Create volume first
        const volume = await docker.createVolume({
            Name: volumeName,
            Labels: { createdAt: new Date().toISOString() }
        });
        console.log(`Created Docker Volume: ${volumeName}`);

        // Create container with the volume
        const container = await docker.createContainer({
            Image: DEFAULT_IMAGE,
            name: containerName,
            Cmd: ['/bin/bash', '-c', `
                apt update && \
                apt upgrade -y && \
                apt install -y curl && \
                curl -fsSL https://code-server.dev/install.sh | sh && \
                code-server --bind-addr 0.0.0.0:8080
            `],
            ExposedPorts: { [CODE_SERVER_PORT]: {} },
            HostConfig: {
                PortBindings: { [CODE_SERVER_PORT]: [{ HostPort: '' }] },
                Binds: [
                    `${volumeName}:/home/coder/project`,
                    `${volumeName}:/home/coder/.local/share/code-server`
                ]
            },
            Labels: {
                createdAt: new Date().toISOString(),
                volumeName: volumeName
            }
        });

        await container.start();
        console.log(`Started Docker Container: ${containerName}`);
        return container;
    } catch (error) {
        console.error('Error in createCodespaceContainer:', error);
        throw error;
    }
}

async function getContainerPort(container) {
    try {
        const containerInfo = await container.inspect();
        return containerInfo.NetworkSettings.Ports[CODE_SERVER_PORT][0].HostPort;
    } catch (error) {
        console.error('Error getting container port:', error);
        throw error;
    }
}

async function cleanupContainer(container, volumeName) {
    try {
        // Stop container
        try {
            await container.stop();
            console.log(`Stopped Container: ${container.id}`);
        } catch (error) {
            if (error.statusCode !== 304) { // Ignore if already stopped
                throw error;
            }
        }

        // Remove container
        await container.remove();
        console.log(`Removed Container: ${container.id}`);

        // Remove volume
        if (volumeName) {
            const volume = docker.getVolume(volumeName);
            await volume.remove();
            console.log(`Removed Volume: ${volumeName}`);
        }
    } catch (error) {
        console.error('Error in cleanupContainer:', error);
        throw error;
    }
}

// ROUTE HANDLERS
async function handleGetRoot(req, res) {
    try {
        const containers = await docker.listContainers({
            all: true,
            filters: { name: ['codespace-'] }
        });

        const codespaces = {};

        await Promise.all(containers.map(async (container) => {
            const containerObj = docker.getContainer(container.Id);
            const containerInfo = await containerObj.inspect();
            const port = containerInfo.NetworkSettings.Ports[CODE_SERVER_PORT]?.[0]?.HostPort;

            codespaces[container.Names[0].replace('/', '')] = {
                id: container.Id,
                port: port,
                state: container.State
            };
        }));

        res.render('pages/index', { codespaces });
    } catch (error) {
        console.error('Error fetching codespaces:', error);
        res.render('pages/index', { codespaces: {}, error: 'Failed to fetch codespaces' });
    }
}

async function handleCreateCodespace(req, res) {
    try {
        const timestamp = Date.now();
        const containerName = `codespace-${timestamp}`;
        const volumeName = `codespace-volume-${timestamp}`;

        await pullImage(DEFAULT_IMAGE);
        const container = await createCodespaceContainer(containerName, volumeName);
        await getContainerPort(container); // Ensure port is available

        res.status(201).json({
            success: true,
            message: 'Container Started Successfully'
        });
    } catch (error) {
        console.error('Error Creating Container:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to Create Container',
            error: error.message
        });
    }
}

async function handleDeleteCodespace(req, res) {
    const { containerId } = req.params;
    
    try {
        const container = docker.getContainer(containerId);
        const containerInfo = await container.inspect();
        const volumeName = containerInfo.Mounts?.[0]?.Name;

        await cleanupContainer(container, volumeName);

        res.status(200).json({
            success: true,
            message: 'Container Removed Successfully'
        });
    } catch (error) {
        console.error('Error Deleting Container:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to Remove Container',
            error: error.message
        });
    }
}

// ROUTES
app.get('/', handleGetRoot);
app.post('/create', handleCreateCodespace);
app.delete('/delete/:containerId', handleDeleteCodespace);

// ERROR HANDLING
app.use((err, req, res, next) => {
    console.error('Unhandled Error:', err);
    res.status(500).json({
        success: false,
        message: 'Internal Server Error'
    });
});

// START SERVER
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});