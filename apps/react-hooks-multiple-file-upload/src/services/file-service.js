import http from "../http-common";

const upload = (file, onUploadProgress) => {
  let formData = new FormData();

  formData.append("file", file);

  return http.post("/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
    onUploadProgress,
  });
};

const getFiles = () => {
  return http.get("/files");
};

const deleteFile = (name) => {
  return http.delete(`/files/${name}`);
};

const FileService = {
  upload,
  getFiles,
  delete: deleteFile,
};

export default FileService;
