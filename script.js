document.addEventListener('DOMContentLoaded', () => {
    const DATA_PATH = 'data/netflix_titles.csv';

    // PapaParse를 사용하여 CSV 파일 로드 및 파싱
    Papa.parse(DATA_PATH, {
        download: true,
        header: true,
        complete: (results) => {
            const data = results.data;
            console.log('Data loaded and parsed:', data);
            
            // 각 차트 생성 함수 호출
            createBarChart(data);
            createLineChart(data);
            createPieChart(data);
            createHistogram(data);
        },
        error: (error) => {
            console.error('Error parsing CSV:', error);
        }
    });

    // 막대 차트: 국가별 콘텐츠 수 (상위 10개국)
    function createBarChart(data) {
        const countryCounts = data.reduce((acc, row) => {
            if (row.country) {
                const countries = row.country.split(',').map(c => c.trim());
                countries.forEach(country => {
                    if (country) {
                        acc[country] = (acc[country] || 0) + 1;
                    }
                });
            }
            return acc;
        }, {});

        const sortedCountries = Object.entries(countryCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10);

        const ctx = document.getElementById('barChart').getContext('2d');
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: sortedCountries.map(c => c[0]),
                datasets: [{
                    label: '콘텐츠 수',
                    data: sortedCountries.map(c => c[1]),
                    backgroundColor: 'rgba(210, 45, 45, 0.7)',
                    borderColor: 'rgba(161, 36, 36, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    title: { display: true, text: '국가별 콘텐츠 수 (상위 10개국)' }
                },
                scales: {
                    y: { beginAtZero: true }
                }
            }
        });
    }

    // 선형 차트: 연도별 콘텐츠 출시량 (2000년 이후)
    function createLineChart(data) {
        const yearCounts = data.reduce((acc, row) => {
            const year = parseInt(row.release_year, 10);
            if (year && year >= 2000) {
                acc[year] = (acc[year] || 0) + 1;
            }
            return acc;
        }, {});

        const sortedYears = Object.entries(yearCounts).sort(([a], [b]) => a - b);

        const ctx = document.getElementById('lineChart').getContext('2d');
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: sortedYears.map(y => y[0]),
                datasets: [{
                    label: '출시된 콘텐츠 수',
                    data: sortedYears.map(y => y[1]),
                    fill: false,
                    borderColor: 'rgba(210, 45, 45, 0.8)',
                    tension: 0.1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    title: { display: true, text: '연도별 콘텐츠 출시량 (2000년 이후)' }
                }
            }
        });
    }

    // 원형 차트: Movie vs TV Show 비율
    function createPieChart(data) {
        const typeCounts = data.reduce((acc, row) => {
            if (row.type) {
                acc[row.type] = (acc[row.type] || 0) + 1;
            }
            return acc;
        }, {});

        const ctx = document.getElementById('pieChart').getContext('2d');
        new Chart(ctx, {
            type: 'pie',
            data: {
                labels: Object.keys(typeCounts),
                datasets: [{
                    data: Object.values(typeCounts),
                    backgroundColor: ['rgba(210, 45, 45, 0.7)', 'rgba(54, 54, 54, 0.7)'],
                    borderColor: ['rgba(161, 36, 36, 1)', 'rgba(40, 40, 40, 1)'],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: { display: true, text: 'Movie vs TV Show 비율' }
                }
            }
        });
    }

    // 히스토그램: 영화 상영 시간 분포
    function createHistogram(data) {
        const durations = data
            .filter(row => row.type === 'Movie' && row.duration)
            .map(row => parseInt(row.duration.replace(' min', ''), 10))
            .filter(d => !isNaN(d));

        const bins = {};
        const binWidth = 10;
        durations.forEach(duration => {
            const bin = Math.floor(duration / binWidth) * binWidth;
            bins[bin] = (bins[bin] || 0) + 1;
        });

        const sortedBins = Object.entries(bins).sort(([a], [b]) => parseInt(a) - parseInt(b));
        
        const labels = sortedBins.map(([bin]) => `${bin}-${parseInt(bin) + binWidth -1} min`);
        const binData = sortedBins.map(([, count]) => count);

        const ctx = document.getElementById('histogramChart').getContext('2d');
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: '영화 수',
                    data: binData,
                    backgroundColor: 'rgba(210, 45, 45, 0.7)',
                    borderColor: 'rgba(161, 36, 36, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    title: { display: true, text: '영화 상영 시간 분포 (분)' }
                },
                scales: {
                    x: {
                        ticks: {
                            maxRotation: 90,
                            minRotation: 45
                        }
                    },
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }
});
