class Dashboard {
  constructor() {
    this.isPaused = false;
    this.init();
  }

  async init() {
    this.updateCurrentTime();
    setInterval(() => this.updateCurrentTime(), 1000);
    await this.fetchData();
    setInterval(() => this.fetchData(), 5000); // Poll every 5 seconds
  }

  updateCurrentTime() {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', { hour12: false });
    document.getElementById("current-time").textContent = timeStr;
  }

  async fetchData() {
    try {
        const response = await fetch('http://localhost:3001/api/latest', {
        headers: {
            'Content-Type': 'application/json'
        }
        });
        
        if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        
        // Transform for UI
        this.updateUI({
        airQuality: data.airQuality ?? '---',
        gas: data.gas ?? '---',
        airStatus: data.airStatus || "Unknown",
        gasStatus: data.gasStatus || "Unknown",
        datetime: data.datetime || "Just now"
        });

    } catch (error) {
        console.error("Using fallback data due to:", error);
        this.updateUI({
        airQuality: 644,
        gas: 821,
        airStatus: "Clean",
        gasStatus: "Warning",
        datetime: new Date().toLocaleTimeString()
        });
    }
    }

  updateUI(data) {
    document.getElementById("air-quality-value").textContent = data.airQuality || '---';
    document.getElementById("gas-value").textContent = data.gas || '---';
    
    const timeStr = data.datetime ? data.datetime.split(' ')[1].substring(0, 5) : '--:--';
    document.getElementById("last-update").textContent = timeStr;

    this.updateStatus('air-quality-status', data.airStatus);
    this.updateStatus('gas-status', data.gasStatus);
  }

  updateStatus(elementId, status) {
    const element = document.getElementById(elementId);
    if (!element || !status) return;

    element.textContent = status;
    element.className = 'data-status'; // Reset classes

    const statusLower = status.toLowerCase();
    if (statusLower.includes('danger') || statusLower.includes('polluted')) {
      element.classList.add('status-danger', 'danger-pulse');
    } else if (statusLower.includes('moderate') || statusLower.includes('warning')) {
      element.classList.add('status-warning');
    } else {
      element.classList.add('status-safe');
    }
  }
}

// Initialize when DOM loads
document.addEventListener('DOMContentLoaded', () => new Dashboard());