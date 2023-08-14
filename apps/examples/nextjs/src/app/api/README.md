### API Routes List
- POST /api/users/[id]/images
  - signs upload url and returns a **signed url** + **confirmation token**
- GET /api/users/[id]/images/[imageId]
  - gets image url **status** and **image variants** if they exist
- DELETE /api/users/[id]/images/[imageId]
  - checks if file exists in db, if yes it deletes the file from db and storage provider as well.
- POST /api/users/[id]/images/[imageId]/confirm
  - validates **confirm token**, checks if image **exists** in the storage provider and finally updates the file status to **uploaded**.