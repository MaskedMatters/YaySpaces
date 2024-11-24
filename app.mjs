import express from 'express';
import Docker from 'dockerode';

const app = express();
const docker = new Docker(); // Connects to default socket

// Need this middleware to parse JSON body in POST requests
app.use(express.json());

app.set('view engine', 'ejs');
app.use('/public', express.static('public'));

const port = 3000;

app.get('/', async (req, res) => {
    try {
        const containers = await docker.listContainers();

        const codespaces = {};
        for (const container of containers) {
            const containerNames = container.Names; 
            for (const name of containerNames) {
                if (name.startsWith('/codespace-')) {
                    // Get the container's port mapping
                    const containerInfo = await docker.getContainer(container.Id).inspect();
                    const port = containerInfo.NetworkSettings.Ports['8080/tcp'][0].HostPort;

                    codespaces[name.substring(1)] = {
                        id: container.Id,
                        port: port
                    };
                }
            }
        }

        res.render('pages/index', { codespaces: codespaces });

    } catch (error) {
        console.error('Error listing containers:', error);
        res.status(500).render('pages/error', { error: 'Failed to list containers' }); 
    }
});

app.post('/create', async (req, res) => {
    try {
        const imageName = 'ubuntu:latest';
        
        // Pull the Ubuntu image first
        console.log('Currently pulling Ubuntu Docker image...');
        await new Promise((resolve, reject) => {
            docker.pull(imageName, (err, stream) => {
                if (err) {
                    reject(err);
                    return;
                }

                // Track pull progress
                docker.modem.followProgress(stream, (err, output) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    resolve(output);
                });
            });
        });
        
        console.log('Successfully pulled Ubuntu Docker image...');

        // Create a unique name for the container
        const containerName = `codespace-${Date.now()}`;
        console.log('Created codespace name...');
        
        // Create the 
        console.log('Creating codespace container...')
        const container = await docker.createContainer({
            Image: 'ubuntu:latest',  // Base image
            name: containerName,
            Cmd: ['/bin/bash', '-c', `
                apt update && \
                apt upgrade -y && \
                apt install -y curl && \
                curl -fsSL https://code-server.dev/install.sh | sh && \
                code-server --bind-addr 0.0.0.0:8080
            `],
            ExposedPorts: {
                '8080/tcp': {}  // code-server port
            },
            HostConfig: {
                PortBindings: {
                    '8080/tcp': [{ HostPort: '' }]  // Randomly assigned port
                }
            }
        });

        // Start the container
        await container.start();
        console.log("Successfully created and started container...");

        // Get container information including port mapping
        const containerInfo = await container.inspect();
        const port = containerInfo.NetworkSettings.Ports['8080/tcp'][0].HostPort;
        console.log(`Container started on port ${port}`)

        res.json({
            success: true, 
            message: 'Container created successfully'
        });
    } catch (error) {
        console.error('Error creating container:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to create container',
            error: error.message 
        });
    }
});

app.delete('/delete', (req, res) => {

});

app.listen(port, () => {
    console.log(`The server has successfully started... please go to the local machines FQDN at port ${port}`)
});