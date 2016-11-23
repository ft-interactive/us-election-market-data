echo begin data;
date;
mkdir -pv -m ugo+rwx,+X $1 && \
mkdir -pv -m ugo+rwx,+X $2 && \
node market-data/data-poller $1;
node market-data/csv-to-chart-json $1/ $2;
date;
echo end data;
