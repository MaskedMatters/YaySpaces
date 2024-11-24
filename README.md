# YaySpaces
A lightweight self-hosted alternative to GitHub Codespaces that uses Docker on the main system to create isolated code environments.

## Changelogs
This is where I put the changelogs for every commit on GitHub (mostly). All changelogs that are old are below, scroll down.

### Changelog (We have a winner, BETA RELEASE | v0.1.0beta-p)

This is our first production release in BETA!! It's REALLY REALLY bad but it works and workspaces can be made. We completely redid the app.mjs file so it was cleaner and more readable for never nesters. I also made it so the index.ejs had buttons and things that worked and just yeah. Check it out by cloning the repository on your local machine and running `npm install` and `npm run start` and it should hopefully work for you too.

**MAKE SURE YOU NEVER KEEP PRESSING THE DELETE BUTTON, IT WORKS SLOWLY!!**

<details>
<summary>Changelog (Completely redo everything, for simplicity... | v0.1.0alpha-d)</summary>
In this change, I completely redid everything and restarted. I am starting with the app.mjs and I coded all of the endpoints (except the root for the web GUI) so it's cleaner and things are in functions and everything. There isn't much to say. I might move all of the functions into a different JavaScript file so I can just use app.mjs as a router of sorts.
</details>

<details>
<summary>Changelog (Add more touches | v0.0.2alpha-d)</summary><br>

Wow, things are happening really fast. In the JavaScript file for the index page, I actually made it so when you press the div, it opens up the code server on the correct port and everything. This will be changed because of the action buttons I added inside the div that will ACTUALLY do all the work. We also just edited the CSS a little bit so things make more sense, probably not fully furnished either.

In the index file, I added all of the EJS logic as a loop to display all of the current workspaces running at this moment. In the actual server file, I added stuff to actually scan all containers to see if there are any running codespaces that need to be in the loopdiloop.

That's about it.
</details>
<details>
<summary>Changelog (First Commit | v0.0.1alpha-d)</summary><br>

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
</details>

## Installation (Usage)

This part of the README will be filled out once it's stable and working.