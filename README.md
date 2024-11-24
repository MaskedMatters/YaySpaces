# YaySpaces
A lightweight self-hosted alternative to GitHub Codespaces that uses Docker on the main system to create isolated code environments.

## Changelog (First Commit | v0.0.1alpha-d)

We created the overall EJS Express directory tree and started work on server endpoints and Docker logic. In the app.mjs file we initiate an express web application and a new docker environment. We host the web GUI on the main root endpoint and we have a /create endpoint for the web GUI to call when the "CREATE NEW WORKSPACE +" button is clicked. To see the code more in detail, visit the app.mjs file

```mjs
// Server ROOT endpoint hosting web application GUI
app.get('/', (req, res) => {
    res.render('pages/index')
});

// Server /create endpoint and logic to create Docker container
app.post('/create', async (req, res) => {
    try {
        const imageName = 'ubuntu:latest';
        
        // Pull the Ubuntu image first
        console.log('Currently pulling Ubuntu Docker image...');
        await new Promise((resolve, reject) => {
            // Logic to pull Ubuntu image from Docker Hub
        });
        
        console.log('Successfully pulled Ubuntu Docker image...');

        // Create a unique name for the container
        const containerName = `codespace-${Date.now()}`;
        console.log('Created codespace name...');
        
        // Create the 
        console.log('Creating codespace container...')
        const container = await docker.createContainer({
            // Docker container logic
        });

        // Start the container
        await container.start();
        console.log("Successfully created and started container...");

        // Get container information including port mapping
        const containerInfo = await container.inspect();
        const port = containerInfo.NetworkSettings.Ports['8080/tcp'][0].HostPort;
        console.log(`Container started on port ${port}`)

        // Respond with normal message and data
    } catch (error) {
        // Respond with error message and data
    }
});
```

We also have a single index page that has a workspace div with just a test workspace item inside and a working button that will call to the server for a new workspace request. The code below shows this.

```ejs
<div class="workspace-container">
    <div class="workspace-item" onclick="openWorkspace('workspace-id')">
        <p>This is a test item!</p>
    </div>
    <div class="workspace-item create-new" onclick="createNewWorkspace()">
        <p class="bold">CREATE NEW WORKSPACE +</p>
    </div>
</div>
```

```js
async function createNewWorkspace() {
    try {
        const response = await fetch('/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();

        if (data.success) {
            console.log('Workspace created:', data);
            window.location.reload();  // Simple solution for now, this doesn't really do anything...
        } else {
            console.error('Server failed to create codespace:', data.message);
            alert('Server failed to create codespace. It is online and responsive, check Docker Daemon.');
        }
    } catch (error) {
        console.error('Error requesting server for codespace:', error);
        alert('Error requesting server for codespace. Please check the server status.');
    }
}
```

Isn't that soooo cool! It actually works to, once you press the button, a Docker container is instantiated, assigned a random port, and updates/upgrades/installs code-server. If you do sudo docker ps, you can see it.

## Installation (Usage)

This part of the README will be filled out once it's stable and working.