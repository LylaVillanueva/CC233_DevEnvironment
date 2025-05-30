console.log("✅ history.js is loaded");
document.addEventListener('DOMContentLoaded', function () {
  const urlParams = new URLSearchParams(window.location.search);
  const dataType = urlParams.get('type') || 'all';
  const titleMap = {
    air: 'AIR QUALITY HISTORY',
    gas: 'GAS LEVEL HISTORY',
    all: 'FULL HISTORY DATA'
  };
  document.getElementById('history-title').textContent = titleMap[dataType] || 'HISTORY DATA';

  const ctx = document.getElementById('history-chart').getContext('2d');
  const chart = new Chart(ctx, {
    type: 'line',
    data: {
      datasets: [
        {
          label: 'Air Quality',
          data: [],
          borderColor: '#00ff88',
          backgroundColor: 'rgba(0, 255, 136, 0.1)',
          tension: 0.4,
          borderWidth: 2,
          pointRadius: 3,
          fill: true
        },
        {
          label: 'Gas Level',
          data: [],
          borderColor: '#ff3d3d',
          backgroundColor: 'rgba(255, 61, 61, 0.1)',
          tension: 0.4,
          borderWidth: 2,
          pointRadius: 3,
          fill: true
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: false,
          grid: { color: 'rgba(255, 255, 255, 0.1)' },
          ticks: { color: 'rgba(255, 255, 255, 0.7)' }
        },
        x: {
          type: 'time',
          time: {
            unit: 'hour',
            displayFormats: {
              hour: 'HH:mm',
              day: 'MMM dd'
            },
            tooltipFormat: 'yyyy-MM-dd HH:mm'
          },
          grid: { color: 'rgba(255, 255, 255, 0.1)' },
          ticks: {
            color: 'rgba(255, 255, 255, 0.7)',
            maxRotation: 45,
            minRotation: 45
          }
        }
      },
      plugins: {
        legend: { labels: { color: 'rgba(255, 255, 255, 0.7)' } },
        tooltip: {
          mode: 'index',
          intersect: false,
          callbacks: {
            label: context => `${context.dataset.label}: ${context.raw.y}`
          }
        }
      },
      interaction: { mode: 'nearest', axis: 'x', intersect: false }
    }
  });

  const filterButtons = document.querySelectorAll('.filter-button');
  filterButtons.forEach(button => {
    button.addEventListener('click', function () {
      filterButtons.forEach(btn => {
        btn.classList.remove('active');
        btn.setAttribute('aria-pressed', 'false');
      });
      this.classList.add('active');
      this.setAttribute('aria-pressed', 'true');

      const range = this.dataset.range;
      loadHistoryData(range, dataType, chart);
    });
  });

  loadHistoryData('24', dataType, chart);
});

async function loadHistoryData(range, type, chart) {
  const tbody = document.getElementById('history-data');
  const chartContainer = document.querySelector('.chart-container');
  const chartAnnouncement = document.getElementById('chart-announcement');

  tbody.innerHTML = `
    <tr>
      <td colspan="5" class="loading">
        <i class="fas fa-spinner fa-spin" aria-hidden="true"></i>
        <span role="status">Loading data for ${getRangeLabel(range)}...</span>
      </td>
    </tr>
  `;
  chartContainer.classList.add('loading');
  if (chartAnnouncement) {
    chartAnnouncement.textContent = `Loading chart data for ${getRangeLabel(range)}`;
  }

  try {
    const response = await fetch(`/api/history?range=${range}&type=${type}`);
    if (!response.ok) {
      throw new Error(`Server returned ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data || data.length === 0) {
      renderNoDataMessage(tbody, chartAnnouncement);
      return;
    }

    renderHistory(data, type, chart, chartAnnouncement, range);

  } catch (error) {
    console.error('Failed to load history data:', error);
    renderErrorMessage(tbody, chartAnnouncement, error.message);
    chart.data.datasets.forEach(dataset => {
      dataset.data = [];
    });
    chart.update();
  } finally {
    chartContainer.classList.remove('loading');
  }
}

function renderHistory(data, type, chart, announcementEl, range) {
  const tbody = document.getElementById('history-data');
  let tableHTML = '';
  const chartData = { air: [], gas: [] };

  data.forEach(entry => {
    const timestamp = entry.timestamp < 1e12 ? entry.timestamp * 1000 : entry.timestamp;
    const date = new Date(timestamp);
    const formattedDate = date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });

    tableHTML += `
      <tr>
        <td>${formattedDate}</td>
        <td>${entry.airQuality ?? 'N/A'}</td>
        <td>${entry.gas ?? entry.gam ?? 'N/A'}</td>
        <td><span class="status-badge ${getStatusClass(entry.airStatus)}">${entry.airStatus || 'Unknown'}</span></td>
        <td><span class="status-badge ${getStatusClass(entry.gasStatus)}">${entry.gasStatus || 'Unknown'}</span></td>
      </tr>
    `;

    if (entry.airQuality !== undefined && (type === 'air' || type === 'all')) {
      chartData.air.push({ x: timestamp, y: entry.airQuality });
    }
    if (entry.gas !== undefined && (type === 'gas' || type === 'all')) {
      chartData.gas.push({ x: timestamp, y: entry.gas });
    }
  });

  tbody.innerHTML = tableHTML || `
    <tr>
      <td colspan="5" class="no-data">
        <i class="fas fa-database" aria-hidden="true"></i>
        <span>No data available for selected time range</span>
      </td>
    </tr>
  `;

  chart.data.datasets[0].data = (type === 'air' || type === 'all') ? chartData.air : [];
  chart.data.datasets[1].data = (type === 'gas' || type === 'all') ? chartData.gas : [];

  chart.options.scales.x.time.unit =
    range === '24' ? 'hour' :
    range === '168' ? 'day' :
    'month';

  chart.update();
  if (announcementEl) {
    announcementEl.textContent = `Chart updated with ${data.length} data points`;
  }
}

function getStatusClass(status) {
  if (!status) return 'status-unknown';
  const statusLower = status.toLowerCase();
  if (statusLower.includes('clean') || statusLower.includes('safe')) return 'status-clean';
  if (statusLower.includes('warning') || statusLower.includes('moderate')) return 'status-warning';
  if (statusLower.includes('danger') || statusLower.includes('polluted')) return 'status-danger';
  return 'status-unknown';
}

function getRangeLabel(range) {
  switch (range) {
    case '24': return '24 Hours';
    case '168': return '7 Days';
    case '720': return '30 Days';
    case 'all': return 'All Time';
    default: return range;
  }
}

function renderNoDataMessage(container, announcementEl) {
  container.innerHTML = `
    <tr>
      <td colspan="5" class="no-data">
        <i class="fas fa-database" aria-hidden="true"></i>
        <span>No data available for selected time range</span>
      </td>
    </tr>
  `;
  if (announcementEl) {
    announcementEl.textContent = 'No data available for selected time range';
  }
}

function renderErrorMessage(container, announcementEl, error) {
  container.innerHTML = `
    <tr>
      <td colspan="5" class="error">
        <i class="fas fa-exclamation-triangle" aria-hidden="true"></i>
        <span>Failed to load data. </span>
        <button class="retry-btn" aria-label="Retry loading data">Retry</button>
      </td>
    </tr>
  `;
  if (announcementEl) {
    announcementEl.textContent = `Error loading data: ${error}`;
  }

  document.querySelector('.retry-btn')?.addEventListener('click', () => {
    const activeFilter = document.querySelector('.filter-button.active');
    if (activeFilter) {
      const range = activeFilter.dataset.range;
      const type = new URLSearchParams(window.location.search).get('type') || 'all';
      loadHistoryData(range, type, chart);
    }
  });
}
