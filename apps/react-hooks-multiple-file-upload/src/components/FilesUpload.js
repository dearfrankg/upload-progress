import React, { useState, useEffect, useRef } from "react";
import FileService from "../services/file-service";

const styles = {
  box: { border: "1px solid red" },
  flex: { display: "flex" },
  flexItem: (ratio) => ({ flex: ratio }),
};

const getHandle = ({
  selectedFiles,
  setSelectedFiles,
  progressInfos,
  setProgressInfos,
  message,
  setMessage,
  fileInfos,
  setFileInfos,
  progressInfosRef,
}) => ({
  component: {
    Progress: () => {
      const hasProgress = progressInfos && progressInfos.val.length > 0;
      if (hasProgress) {
        return progressInfos.val.map((progressInfo, index) => (
          <div className="mb-2" key={index}>
            <span>{progressInfo.fileName}</span>
            <div className="progress">
              <div
                className="progress-bar progress-bar-info"
                role="progressbar"
                aria-valuenow={progressInfo.percentage}
                aria-valuemin="0"
                aria-valuemax="100"
                style={{ width: progressInfo.percentage + "%" }}
              >
                {progressInfo.percentage}%
              </div>
            </div>
          </div>
        ));
      }

      return null;
    },

    FileControls: ({ handle }) => (
      <div className="row my-3">
        <div className="col-8">
          <label className="btn btn-default p-0">
            <input type="file" multiple onChange={handle.selectFiles} />
          </label>
        </div>

        <div className="col-4">
          <button
            className="btn btn-success btn-sm"
            disabled={!selectedFiles}
            onClick={() => handle.uploadFiles(handle)}
          >
            Upload
          </button>
        </div>
      </div>
    ),

    Messages: () => {
      const hasMessages = message.length > 0;
      if (hasMessages) {
        return (
          <div className="alert alert-secondary" role="alert">
            <ul>
              {message.map((item, i) => {
                return <li key={i}>{item}</li>;
              })}
            </ul>
          </div>
        );
      }

      return null;
    },

    FileList: ({ handle }) => (
      <div className="card">
        <div className="card-header">List of Files</div>
        <ul className="list-group list-group-flush">
          {fileInfos &&
            fileInfos.map((file, index) => (
              <li className="list-group-item" key={index}>
                <div style={styles.flex}>
                  <div style={styles.flexItem(1)}>
                    <a href={file.url}>{file.name}</a>
                  </div>
                  <div style={{ ...styles.flexItem(1), textAlign: "right" }}>
                    <button onClick={() => handle.deleteFile(file.name)}>x</button>
                  </div>
                </div>
              </li>
            ))}
        </ul>
      </div>
    ),
  },

  sideEffect: {
    useGetFiles: () => {
      useEffect(() => {
        FileService.getFiles().then((response) => setFileInfos(response.data));
      }, []);
    },
  },

  event: {
    selectFiles: (event) => {
      setSelectedFiles(event.target.files);
      setProgressInfos({ val: [] });
    },

    uploadFiles: async (handle) => {
      const files = Array.from(selectedFiles);

      let _progressInfos = files.map((file) => ({ percentage: 0, fileName: file.name }));

      progressInfosRef.current = {
        val: _progressInfos,
      };

      const uploadPromises = files.map((file, i) => handle.upload(i, file));

      await Promise.all(uploadPromises);
      setFileInfos(await FileService.getFiles().then((res) => res.data));
      setMessage([]);
    },

    deleteFile: async (name) => {
      await FileService.delete(name);
      FileService.getFiles().then((response) => {
        setFileInfos(response.data);
      });
    },
  },

  util: {
    upload: (idx, file) => {
      let _progressInfos = [...progressInfosRef.current.val];
      return FileService.upload(file, (event) => {
        _progressInfos[idx].percentage = Math.round((100 * event.loaded) / event.total);
        setProgressInfos({ val: _progressInfos });
      })
        .then(() => {
          setMessage((prevMessage) => [
            ...prevMessage,
            "Uploaded the file successfully: " + file.name,
          ]);
        })
        .catch(() => {
          _progressInfos[idx].percentage = 0;
          setProgressInfos({ val: _progressInfos });

          setMessage((prevMessage) => [...prevMessage, "Could not upload the file: " + file.name]);
        });
    },
  },
});

const UploadFiles = () => {
  const [selectedFiles, setSelectedFiles] = useState(undefined);
  const [progressInfos, setProgressInfos] = useState({ val: [] });
  const [message, setMessage] = useState([]);
  const [fileInfos, setFileInfos] = useState([]);
  const progressInfosRef = useRef(null);

  const handle = getHandle({
    selectedFiles,
    setSelectedFiles,
    progressInfos,
    setProgressInfos,
    message,
    setMessage,
    fileInfos,
    setFileInfos,
    progressInfosRef,
  });

  handle.sideEffect.useGetFiles();

  const { Progress, FileControls, Messages, FileList } = handle.component;

  return (
    <div>
      <Progress />
      <FileControls {...{ handle: { ...handle.event, ...handle.util } }} />
      <Messages />
      <FileList {...{ handle: handle.event }} />
    </div>
  );
};

export default UploadFiles;
