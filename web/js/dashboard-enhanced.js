// Enhanced Dashboard JavaScript
class HealthLinkDashboard {
    constructor() {
        this.charts = {};
        this.currentPeriod = 'today';
        this.init();
    }

    init() {
        this.loadStats();
        this.initCharts();
        this.setupFilters();
        this.setupAutoRefresh();
    }

    // Load dashboard statistics
    async loadStats() {
        try {
            const response = await fetch('/api/dashboard/stats');
            const data = await response.json();
            
            if (data.success) {
                this.updateStatCards(data.data);
                this.loadComplaints();
                this.loadReports();
            }
        } catch (error) {
            console.error('Failed to load stats:', error);
        }
    }

    // Update stat cards with data
    updateStatCards(stats) {
        document.getElementById('statTotalComplaints').textContent = stats.totalComplaints || 0;
        document.getElementById('statPendingComplaints').textContent = stats.pendingComplaints || 0;
        document.getElementById('statResolvedComplaints').textContent = stats.resolvedComplaints || 0;
        document.getElementById('statTotalReports').textContent = stats.totalReports || 0;
        document.getElementById('statPendingReports').textContent = stats.pendingReports || 0;
    }

    // Initialize all charts
    async initCharts() {
        await this.loadAnalytics();
        this.createCategoryChart();
        this.createTrendChart();
        this.createChannelChart();
        this.createReportTypeChart();
        this.createPriorityChart();
        this.createResolutionTimeChart();
    }

    // Load analytics data
    async loadAnalytics() {
        try {
            const response = await fetch('http://localhost:3000/api/analytics/complaints');
            const data = await response.json();
            
            if (data.success) {
                this.analyticsData = data.data;
                this.updateAllCharts(data.data);
            }
        } catch (error) {
            console.error('Failed to load analytics:', error);
        }
    }

    // Create Category Distribution Chart
    createCategoryChart() {
        const ctx = document.getElementById('categoryChart')?.getContext('2d');
        if (!ctx) return;

        this.charts.category = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Waiting Time', 'Staff Attitude', 'Drug Availability', 'Equipment', 'Cleanliness', 'Other'],
                datasets: [{
                    data: [0, 0, 0, 0, 0, 0],
                    backgroundColor: [
                        '#FF6384', '#36A2EB', '#FFCE56',
                        '#4BC0C0', '#9966FF', '#FF9F40'
                    ],
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true
                        }
                    },
                    title: {
                        display: true,
                        text: 'Complaint Categories',
                        font: { size: 16 }
                    }
                }
            }
        });
    }

    // Create Daily Trend Chart
    createTrendChart() {
        const ctx = document.getElementById('trendChart')?.getContext('2d');
        if (!ctx) return;

        this.charts.trend = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Complaints',
                    data: [],
                    borderColor: '#2e7d32',
                    backgroundColor: 'rgba(46, 125, 50, 0.1)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4,
                    pointHoverRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { stepSize: 1 }
                    }
                }
            }
        });
    }

    // Create Channel Distribution Chart
    createChannelChart() {
        const ctx = document.getElementById('channelChart')?.getContext('2d');
        if (!ctx) return;

        this.charts.channel = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Web', 'USSD', 'SMS', 'WhatsApp'],
                datasets: [{
                    label: 'Submissions by Channel',
                    data: [0, 0, 0, 0],
                    backgroundColor: ['#4caf50', '#2196F3', '#FF9800', '#25D366'],
                    borderRadius: 5
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { stepSize: 1 }
                    }
                }
            }
        });
    }

    // Create Report Type Chart
    createReportTypeChart() {
        const ctx = document.getElementById('reportTypeChart')?.getContext('2d');
        if (!ctx) return;

        this.charts.reportType = new Chart(ctx, {
            type: 'polarArea',
            data: {
                labels: ['Drug Stockout', 'Equipment', 'Staff Shortage', 'Infrastructure'],
                datasets: [{
                    data: [0, 0, 0, 0],
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.7)',
                        'rgba(54, 162, 235, 0.7)',
                        'rgba(255, 206, 86, 0.7)',
                        'rgba(75, 192, 192, 0.7)'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    // Create Priority Distribution Chart
    createPriorityChart() {
        const ctx = document.getElementById('priorityChart')?.getContext('2d');
        if (!ctx) return;

        this.charts.priority = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Critical', 'High', 'Medium', 'Low'],
                datasets: [{
                    label: 'Reports by Priority',
                    data: [0, 0, 0, 0],
                    backgroundColor: ['#c62828', '#e65100', '#f57f17', '#2e7d32'],
                    borderRadius: 5
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: 'y',
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        ticks: { stepSize: 1 }
                    }
                }
            }
        });
    }

    // Create Resolution Time Chart
    createResolutionTimeChart() {
        const ctx = document.getElementById('resolutionChart')?.getContext('2d');
        if (!ctx) return;

        this.charts.resolution = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
                datasets: [{
                    label: 'Avg Resolution Time (hours)',
                    data: [48, 36, 24, 12],
                    borderColor: '#1565c0',
                    backgroundColor: 'rgba(21, 101, 192, 0.1)',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Hours'
                        }
                    }
                }
            }
        });
    }

    // Update all charts with new data
    updateAllCharts(data) {
        // Update category chart
        if (this.charts.category && data.categoryBreakdown) {
            this.charts.category.data.datasets[0].data = [
                data.categoryBreakdown.waiting_time || 0,
                data.categoryBreakdown.staff_attitude || 0,
                data.categoryBreakdown.drug_availability || 0,
                data.categoryBreakdown.equipment || 0,
                data.categoryBreakdown.cleanliness || 0,
                data.categoryBreakdown.other || 0,
            ];
            this.charts.category.update();
        }

        // Update trend chart
        if (this.charts.trend && data.dailyTrend) {
            this.charts.trend.data.labels = data.dailyTrend.map(d => d.date);
            this.charts.trend.data.datasets[0].data = data.dailyTrend.map(d => d.count);
            this.charts.trend.update();
        }

        // Update channel chart
        if (this.charts.channel && data.channelBreakdown) {
            this.charts.channel.data.datasets[0].data = [
                data.channelBreakdown.web || 0,
                data.channelBreakdown.ussd || 0,
                data.channelBreakdown.sms || 0,
                data.channelBreakdown.whatsapp || 0,
            ];
            this.charts.channel.update();
        }
    }

    // Setup filters
    setupFilters() {
        const periodFilter = document.getElementById('periodFilter');
        if (periodFilter) {
            periodFilter.addEventListener('change', (e) => {
                this.currentPeriod = e.target.value;
                this.loadStats();
                this.loadAnalytics();
            });
        }

        const statusFilter = document.getElementById('statusFilter');
        if (statusFilter) {
            statusFilter.addEventListener('change', (e) => {
                this.filterByStatus(e.target.value);
            });
        }

        document.getElementById('searchInput')?.addEventListener('input', (e) => {
            this.searchItems(e.target.value);
        });

        document.getElementById('refreshBtn')?.addEventListener('click', () => {
            this.refreshData();
        });
    }

    // Filter by status
    filterByStatus(status) {
        const rows = document.querySelectorAll('#complaintsTableBody tr');
        rows.forEach(row => {
            if (!status || row.dataset.status === status) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
    }

    // Search functionality
    async searchItems(query) {
        if (query.length < 2) return;
        
        try {
            const response = await fetch(`http://localhost:3000/api/search?q=${query}`);
            const data = await response.json();
            
            if (data.success) {
                this.displaySearchResults(data.results);
            }
        } catch (error) {
            console.error('Search failed:', error);
        }
    }

    // Display search results
    displaySearchResults(results) {
        // Implementation for search results display
        console.log('Search results:', results);
    }

    // Load complaints table
    async loadComplaints() {
        try {
            const response = await fetch('/api/dashboard/stats');
            const data = await response.json();
            
            if (data.success) {
                this.renderComplaintsTable(data.data);
            }
        } catch (error) {
            console.error('Failed to load complaints:', error);
        }
    }

    // Render complaints table
    renderComplaintsTable(complaints) {
        const tbody = document.getElementById('complaintsTableBody');
        if (!tbody) return;

        tbody.innerHTML = complaints.map(c => `
            <tr data-status="${c.status}">
                <td><strong>${c.ticketId}</strong></td>
                <td>${c.name || 'Anonymous'}</td>
                <td>${c.phoneNumber}</td>
                <td>${(c.category || '').replace('_', ' ')}</td>
                <td>${c.healthFacility || 'N/A'}</td>
                <td><span class="status status-${c.status}">${c.status}</span></td>
                <td>${new Date(c.createdAt).toLocaleDateString()}</td>
                <td>
                    ${c.status === 'pending' ? 
                        `<button class="btn btn-primary btn-small" onclick="dashboard.respond('${c.ticketId}')">Respond</button>` : 
                        'Resolved'}
                </td>
            </tr>
        `).join('');
    }

    // Load reports table
    async loadReports() {
        try {
            const response = await fetch('http://localhost:3000/api/reports');
            const data = await response.json();
            
            if (data.success) {
                this.renderReportsTable(data.data);
            }
        } catch (error) {
            console.error('Failed to load reports:', error);
        }
    }

    // Render reports table
    renderReportsTable(reports) {
        const tbody = document.getElementById('reportsTableBody');
        if (!tbody) return;

        tbody.innerHTML = reports.map(r => `
            <tr>
                <td><strong>${r.reportId}</strong></td>
                <td>${r.facility}</td>
                <td>${r.workerName}</td>
                <td>${(r.reportType || '').replace('_', ' ')}</td>
                <td>
                    <span class="priority-indicator priority-${r.priority}">
                        ${r.priority}
                    </span>
                </td>
                <td><span class="status status-${r.status === 'submitted' ? 'pending' : r.status}">${r.status}</span></td>
                <td>${new Date(r.createdAt).toLocaleDateString()}</td>
                <td>
                    <button class="btn btn-secondary btn-small" onclick="dashboard.updateReportStatus('${r.reportId}')">Update</button>
                </td>
            </tr>
        `).join('');
    }

    // Respond to complaint
    respond(ticketId) {
        const message = prompt('Enter response message:');
        if (message) {
            fetch(`http://localhost:3000/api/feedback/respond/${ticketId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message })
            })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    alert('Response sent successfully!');
                    this.loadComplaints();
                    this.loadStats();
                }
            });
        }
    }

    // Update report status
    updateReportStatus(reportId) {
        const status = prompt('Enter new status (acknowledged/in_progress/resolved):');
        if (status) {
            fetch(`http://localhost:3000/api/reports/${reportId}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    alert('Status updated!');
                    this.loadReports();
                    this.loadStats();
                }
            });
        }
    }

    // Auto refresh
    setupAutoRefresh() {
        setInterval(() => {
            this.loadStats();
        }, 60000); // Refresh every minute
    }

    // Manual refresh
    refreshData() {
        this.loadStats();
        this.loadAnalytics();
        alert('Dashboard refreshed!');
    }

    // Export data
    exportCSV() {
        window.open('http://localhost:3000/api/export/complaints/csv');
    }

    exportJSON() {
        window.open('http://localhost:3000/api/export/complaints/json');
    }

    // Print dashboard
    printDashboard() {
        window.print();
    }
}

// Initialize dashboard when DOM is ready
let dashboard;
document.addEventListener('DOMContentLoaded', () => {
    dashboard = new HealthLinkDashboard();
});