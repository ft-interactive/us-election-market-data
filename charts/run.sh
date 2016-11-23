echo begin charts;
date;
mkdir -pv -m ugo+rwx,+X tmp && \
mkdir -pv -m ugo+rwx,+X $2 && \
node charts $1 tmp;
mv -f tmp/*.svg $2;
date;
echo end charts;
