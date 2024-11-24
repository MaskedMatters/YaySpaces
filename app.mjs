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
const persistent_storage = __dirname + '/code_volumes'

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
app.get('/', (req, res) => {

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
        const port = await getContainerPort(container);

        console.log(`Container Started on Port: ${port}`);

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