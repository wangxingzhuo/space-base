#! /bin/make

mongo:
	docker run -d --restart=always --network=misaka --ip=172.24.0.4 -v /data/mongo_data:/data/db --name=mongodb mongo

start:
	docker run -d --restart=always --network=misaka --ip=172.24.0.110 -v /var/log/stocker:/var/log/app --name=stocker stock-node

setup:
	docker buildx build -t stock-node .

rm:
	docker stop stocker
	docker rm stocker
