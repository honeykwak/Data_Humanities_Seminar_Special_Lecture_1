document.addEventListener('DOMContentLoaded', () => {
    const CSV_DATA_PATH = 'data/netflix_titles.csv';
    const JSON_DATA_PATH = 'data/netflix_hierarchical_data.json';

    // --- 1. CSV 데이터 기반 차트 생성 (Chart.js) ---
    Papa.parse(CSV_DATA_PATH, {
        download: true,
        header: true,
        complete: (results) => {
            const data = results.data.filter(row => row.show_id);
            console.log('CSV Data loaded and parsed:', data);
            createBarChart(data);
            createLineChart(data);
            createPieChart(data);
            createHistogram(data);
        },
        error: (error) => console.error('Error parsing CSV:', error)
    });

    // --- 2. Google Charts 로드 및 콜백 함수 지정 ---
    // Google Charts 라이브러리를 로드합니다.
    google.charts.load('current', { 'packages': ['treemap'] });
    // 라이브러리가 준비되면 drawTreemapChart 함수를 실행하도록 콜백을 설정합니다.
    google.charts.setOnLoadCallback(drawTreemapChart);

    /**
     * Google Charts 라이브러리가 완전히 로드된 후 실행되는 함수.
     * 이 함수 안에서 데이터를 가져오고 차트를 그립니다.
     */
    function drawTreemapChart() {
        fetch(JSON_DATA_PATH)
            .then(response => {
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                return response.json();
            })
            .then(jsonData => {
                console.log('Google Charts is ready and JSON data is loaded.');
                const dataTable = new google.visualization.DataTable();
                dataTable.addColumn('string', 'ID');
                dataTable.addColumn('string', 'Parent');
                dataTable.addColumn('number', 'Count');

                const rows = [];
                rows.push([jsonData.name, null, 0]); // 최상위 노드

                jsonData.children.forEach(typeNode => {
                    rows.push([typeNode.name, jsonData.name, typeNode.value]); // 1레벨 노드
                    if (typeNode.children) {
                        typeNode.children.forEach(ratingNode => {
                            rows.push([ratingNode.name, typeNode.name, ratingNode.value]); // 2레벨 노드
                        });
                    }
                });
                
                dataTable.addRows(rows);

                const options = {
                    minColor: '#f0f0f0',
                    midColor: '#d22d2d',
                    maxColor: '#a12424',
                    headerHeight: 25,
                    fontColor: 'white',
                    showScale: true,
                    highlightOnMouseOver: true,
                    generateTooltip: (row, size) => {
                        const label = dataTable.getValue(row, 0);
                        if (dataTable.getValue(row, 1) === null) return '';
                        return `<div style="background:black; color:white; padding:10px; border-style:solid; border-width:1px;">
                            <b>${label}</b>: ${size.toLocaleString()}
                        </div>`;
                    }
                };

                const chart = new google.visualization.TreeMap(document.getElementById('treemapChart'));
                chart.draw(dataTable, options);
            })
            .catch(error => console.error('Error during Google Chart setup:', error));
    }

    // --- 기존 Chart.js 생성 함수들 (변경 없음) ---
    function createBarChart(data) {
        const countryCounts = data.reduce((acc, row) => {
            if (row.country) {
                const countries = row.country.split(',').map(c => c.trim());
                countries.forEach(country => { if (country) acc[country] = (acc[country] || 0) + 1; });
            }
            return acc;
        }, {});
        const sortedCountries = Object.entries(countryCounts).sort(([, a], [, b]) => b - a).slice(0, 10);
        const ctx = document.getElementById('barChart').getContext('2d');
        new Chart(ctx, { type: 'bar', data: { labels: sortedCountries.map(c => c[0]), datasets: [{ label: '콘텐츠 수', data: sortedCountries.map(c => c[1]), backgroundColor: 'rgba(210, 45, 45, 0.7)', borderColor: 'rgba(161, 36, 36, 1)', borderWidth: 1 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, title: { display: true, text: '국가별 콘텐츠 수 (상위 10개국)' } }, scales: { y: { beginAtZero: true } } } });
    }
    function createLineChart(data) {
        const yearCounts = data.reduce((acc, row) => {
            const year = parseInt(row.release_year, 10);
            if (year && year >= 2000) acc[year] = (acc[year] || 0) + 1;
            return acc;
        }, {});
        const sortedYears = Object.entries(yearCounts).sort(([a], [b]) => a - b);
        const ctx = document.getElementById('lineChart').getContext('2d');
        new Chart(ctx, { type: 'line', data: { labels: sortedYears.map(y => y[0]), datasets: [{ label: '출시된 콘텐츠 수', data: sortedYears.map(y => y[1]), fill: false, borderColor: 'rgba(210, 45, 45, 0.8)', tension: 0.1 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, title: { display: true, text: '연도별 콘텐츠 출시량 (2000년 이후)' } } } });
    }
    function createPieChart(data) {
        const typeCounts = data.reduce((acc, row) => {
            if (row.type) acc[row.type] = (acc[row.type] || 0) + 1;
            return acc;
        }, {});
        const ctx = document.getElementById('pieChart').getContext('2d');
        new Chart(ctx, { type: 'pie', data: { labels: Object.keys(typeCounts), datasets: [{ data: Object.values(typeCounts), backgroundColor: ['rgba(210, 45, 45, 0.7)', 'rgba(54, 54, 54, 0.7)'], borderColor: ['rgba(161, 36, 36, 1)', 'rgba(40, 40, 40, 1)'], borderWidth: 1 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { title: { display: true, text: 'Movie vs TV Show 비율' } } } });
    }
    function createHistogram(data) {
        const durations = data.filter(row => row.type === 'Movie' && row.duration).map(row => parseInt(row.duration.replace(' min', ''), 10)).filter(d => !isNaN(d));
        const bins = {};
        const binWidth = 10;
        durations.forEach(duration => {
            const bin = Math.floor(duration / binWidth) * binWidth;
            bins[bin] = (bins[bin] || 0) + 1;
        });
        const sortedBins = Object.entries(bins).sort(([a], [b]) => parseInt(a) - parseInt(b));
        const labels = sortedBins.map(([bin]) => `${bin}-${parseInt(bin) + binWidth - 1} min`);
        const binData = sortedBins.map(([, count]) => count);
        const ctx = document.getElementById('histogramChart').getContext('2d');
        new Chart(ctx, { type: 'bar', data: { labels: labels, datasets: [{ label: '영화 수', data: binData, backgroundColor: 'rgba(210, 45, 45, 0.7)', borderColor: 'rgba(161, 36, 36, 1)', borderWidth: 1 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, title: { display: true, text: '영화 상영 시간 분포 (분)' } }, scales: { x: { ticks: { maxRotation: 90, minRotation: 45 } }, y: { beginAtZero: true } } } });
    }
});
