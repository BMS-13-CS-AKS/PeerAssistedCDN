# insert-images

reads image from the the folder given as argument and serves those images

## Usage

```sh
  $ npm install
```
Copy images into input folder and then type following in terminal

```sh
  $ node index.js input data  
```
data is optional paramater which if provided adds data infront of src in image tag (<img data-src = ... />)

Then open http://localhost:5000/ which displays the number of images. Going to http://localhost:5000/main serves those images in html page

