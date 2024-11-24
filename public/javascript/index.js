async function openCodeServer(port) {
    try {
        window.location.href = `http://${window.location.hostname}:${port}`;
    } catch (error) {
        console.error('Error opening code server:', error);
        alert('Failed to open code server. Please check your browser settings or contact support.');
    }
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
            alert('Workspace deleted successfully.');
            window.location.reload();
        } else {
            console.error('Server failed to delete codespace:', data.message);
            alert('Failed to delete workspace. Please check the server logs for more details.');
        }
    } catch (error) {
        console.error('Error requesting server for codespace:', error);
        alert('Error communicating with the server. Please check your internet connection or server status.');
    }
}

async function createNewWorkspace() {
    try {
        // Add loading indicator here
        const response = await fetch('/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();

        // Remove loading indicator here
        if (data.success) {
            console.log('Workspace created:', data);
            alert('Workspace created successfully.');
            window.location.reload();
        } else {
            console.error('Server failed to create codespace:', data.message);
            alert('Failed to create workspace. Please check the server logs for more details.');
        }
    } catch (error) {
        console.error('Error requesting server for codespace:', error);
        alert('Error communicating with the server. Please check your internet connection or server status.');
    }
}