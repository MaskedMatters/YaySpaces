// IMPORT ALL LIBRARIES
import express from 'express';
import Docker from 'dockerode';

// CONFIGURE EXPRESS, EJS, AND DOCKERODE
const app = express();
app.set('view engine', 'ejs');
app.use('/public', express.static('public'));
app.use(express.json())

const docker = new Docker();

const port = 3000;

// DOCKERODE FUNCTIONS & LOGIC
async function pullImage(imageName) {
    return new Promise((resolve, reject) => {
        console.log(`Pulling Docker Image: ${imageName}`);

        docker.pull(imageName, (err, stream) => {
            if (err) {
                reject(err);
                return;
            }

            docker.modem.followProgress(stream, (err, output) => {
                if (err) {
                    reject(err);
                    return;
                }

                console.log(`Successfully Pulled Docker Image: ${imageName}`);
                resolve(output);
            });
        });
    });
}

async function createCodespaceContainer(containerName, volumeName) {
    const volume = await docker.createVolume({
        Name: volumeName
    });
    console.log(`Created Docker Volume: ${volumeName}`)

    const container = await docker.createContainer({
        Image: 'ubuntu:latest',
        name: containerName,
        Cmd: ['/bin/bash', '-c', `
            apt update && \
            apt upgrade -y && \
            apt install -y curl && \
            curl -fsSL https://code-server.dev/install.sh | sh && \
            code-server --bind-addr 0.0.0.0:8080
        `],
        ExposedPorts: { '8080/tcp': {} },
        HostConfig: {
            PortBindings: { '8080/tcp': [{ HostPort: '' }] },
            Binds: [
                `${volumeName}:/home/coder/project`,
                `${volumeName}:/home/coder/.local/share/code-server`
            ]
        }
    });

    await container.start();
    console.log(`Started Docker Container: ${containerName}`);
    return container;
}

async function getContainerPort(container) {
    const containerInfo = await container.inspect();
    return containerInfo.NetworkSettings.Ports['8080/tcp'][0].HostPort;
}

// ADD SERVER ENDPOINT STRUCTURE

// Root endpoint
// ... (your existing code) ...

// Root endpoint
app.get('/', async (req, res) => {
    res.render('pages/index', { codespaces: [], loading: true });

    try {
        const containers = await docker.listContainers({ all: true }); // Get all containers
    
        // Extract relevant information from the containers
        const codespaces = containers
            .filter(container => container.Names.some(name => name.startsWith('/codespace-'))) 
            .map(container => ({
                id: container.Id,
                name: container.Names[0].substring(1), // Remove the leading '/'
                port: container.Ports.find(port => port.PrivatePort === 8080)?.PublicPort || null 
            }));
    
        res.render('pages/index', { codespaces, loading: false });
    
    } catch (error) {
        console.error('Error fetching codespaces:', error);
        res.status(500).render('pages/index', { 
            codespaces: [], 
            loading: false, 
            error: 'Failed to fetch codespaces' 
        });
    }
});

// Create codespace endpoint
app.post('/create', async (req, res) => {
    try {
        const imageName = 'ubuntu:latest';

        const date = Date.now();

        const containerName = `codespace-${date}`;
        const volumeName = `codespace-volume-${date}`;

        await pullImage(imageName);

        const container = await createCodespaceContainer(containerName, volumeName);
        const container_port = await getContainerPort(container);

        console.log(`Container Started on Port: ${container_port}`);

        res.status(201).json({
            success: true,
            message: 'Container Started Successfully'
        })
    } catch (error) {
        console.error(`Error Creation Container: ${error}`);
        res.status(501).json({
            success: false,
            message: 'Failed to Create Container',
            error: error.message
        });
    }
});

// Delete codespace endpoint
app.delete('/delete/:containerId', async (req, res) => {
    try {
        const containerId = req.params.containerId;
        const container = docker.getContainer(containerId);
        
        const volumeName = await container.inspect().Mounts[0].Name;

        try {
            await container.stop();
            console.log(`Stopped Container: ${containerId}`)
        } catch (error) {
            console.error(`Error Stopping Container: ${containerId}`)
            console.error(error)
        }

        try {
            await container.remove();
            console.log(`Removed Container: ${containerId}`);
        } catch (error) {
            console.error(`Error Removing Container: ${containerId}`);
            console.error(error);
        }

        try {
            const volume = docker.getVolume(volumeName);
            await volume.remove();
            console.log(`Removed Volume: ${volumeName}`);
        } catch (error) {
            console.error(`Error Removing Volume: ${volumeName}`);
            console.error(error);
        }

        res.status(202).json({
            success: true,
            message: 'Container Removed Successfully'
        })
    } catch (error) {
        res.status(502).json({
            success: false,
            message: 'Faled to Remove Container',
            error: error.message
        });
    }
});

app.listen(port, () => {
    console.log(`The server is currently running on port... ${port}`);
});