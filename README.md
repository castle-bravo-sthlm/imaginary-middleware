# imaginary-middleware
Express middleware for creating and caching image versions produced by the Imaginary image processing service (https://github.com/h2non/imaginary)

### To run imaginary on localhost
	docker run --name=imaginary -d -p 9000:9000 -e "DEBUG=*" h2non/imaginary -cors -concurrency 10

### Using middleware
Check example directory.
And also look at https://github.com/h2non/imaginary for available transformations (endpoints) and parameters.
  
**resize image**    
http://nodejs-server/images/image.jpg?transformation=resize&width=200