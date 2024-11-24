function openCodeServer(port) {
    window.location.href = `http://${window.location.hostname}:${port}`
}

function openVSCode(port) {
    alert("No... not yet...")
}

function openTerminal() {
    alert("Not yet either...")
}

async function deleteCodespace(id) {
    try {
        const response = await fetch(`/delete/${id}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();

        if (data.success) {
            console.log('Workspace deleted:', data);
            // You might want to refresh the page or add the new workspace to the UI
            window.location.reload();  // Simple solution for now
        } else {
            console.error('Server failed to delete codespace:', data.message);
            alert('Server failed to delete codespace. It is online and responsive, check Docker Daemon.');
        }
    } catch (error) {
        console.error('Error requesting server for codespace:', error);
        alert('Error requesting server for codespace. Please check the server status.');
    }
}

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
            // You might want to refresh the page or add the new workspace to the UI
            window.location.reload();  // Simple solution for now
        } else {
            console.error('Server failed to create codespace:', data.message);
            alert('Server failed to create codespace. It is online and responsive, check Docker Daemon.');
        }
    } catch (error) {
        console.error('Error requesting server for codespace:', error);
        alert('Error requesting server for codespace. Please check the server status.');
    }
}