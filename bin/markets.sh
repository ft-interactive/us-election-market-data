./market-data/run.sh data conf && \
./charts/run.sh ../conf/us-election-market-chart-data.json $1
cp data/*.csv /var/opt/customer/apps/interactive.ftdata.co.uk/var/www/html/data/us-election;