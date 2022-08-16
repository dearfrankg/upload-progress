import React, { useState, useEffect, useRef } from "react";
import FileService from "../services/file-service";

const getHandle = ({
  selectedFiles,
  setSelectedFiles,
  progressInfos,
  setProgressInfos,
  message,
  setMessage,
  fileInfos,
  setFileInfos,
  dragging,
  setDragging,
  progressInfosRef,
}) => {
  const handle = {
    styles: {
      box: { border: "1px solid red" },
      flex: { display: "flex" },
      flexItem: (ratio) => ({
        flex: ratio,
        display: "flex",
      }),
      dragger: (dragging) => ({
        display: "flex",
        position: "relative",
        height: 200,
        width: "100%",
        margin: "20px 0",
        background: "bisque",
        opacity: 0.8,
        border: `4px dotted ${dragging ? "blue" : "silver"}`,
        borderRadius: 20,
      }),
      draggerInput: {
        position: "absolute",
        border: "none",
        opacity: 0,
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
      },
    },
  };

  const styles = handle.styles;

  const content = {
    components: {
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

      DndContent: () => (
        <div
          style={{
            ...styles.flexItem(1),
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <h3>Select one or multiple files</h3>
        </div>
      ),

      DragAndDrop: () => {
        const { DndContent } = handle.components;

        return (
          <div
            onDragEnter={handle.events.dragEnter}
            onDragOver={handle.events.dragEnter}
            onDragLeave={handle.events.dragLeave}
            onDrop={handle.events.drop}
            style={styles.dragger(dragging)}
          >
            <DndContent />
          </div>
        );
      },

      FileInputButton: () => {
        const { DndContent } = handle.components;

        return (
          <div onDragEnter={handle.events.dragEnter} style={styles.dragger(dragging)}>
            <DndContent />
            <input
              type="file"
              style={styles.draggerInput}
              multiple
              onChange={handle.events.selectFiles}
            />
          </div>
        );
      },

      FileControls: () => {
        const { FileInputButton, DragAndDrop } = handle.components;

        return dragging ? <DragAndDrop /> : <FileInputButton />;
      },

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

      FileList: () => (
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
                    <div style={{ ...styles.flexItem(1), justifyContent: "flex-end" }}>
                      <button onClick={() => handle.events.deleteFile(file.name)}>x</button>
                    </div>
                  </div>
                </li>
              ))}
          </ul>
        </div>
      ),
    },

    events: {
      selectFiles: (event) => {
        setSelectedFiles(event.target.files);
        setProgressInfos({ val: [] });
        handle.events.uploadFiles(event.target.files);
      },

      uploadFiles: async (selectedFiles) => {
        const files = Array.from(selectedFiles);

        let _progressInfos = files.map((file) => ({ percentage: 0, fileName: file.name }));

        progressInfosRef.current = {
          val: _progressInfos,
        };

        const uploadPromises = files.map((file, i) => handle.utils.upload(i, file));

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

      dragEnter: (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragging(true);
      },

      dragLeave: (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragging(false);
      },

      drop: (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragging(false);

        const { files } = e.dataTransfer;
        if (files && files.length) {
          handle.events.uploadFiles(files);
        }
      },
    },

    utils: {
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

            setMessage((prevMessage) => [
              ...prevMessage,
              "Could not upload the file: " + file.name,
            ]);
          });
      },
    },

    sideEffects: {
      useGetFiles: () => {
        useEffect(() => {
          FileService.getFiles().then((response) => setFileInfos(response.data));
        }, []);
      },
    },
  };

  return Object.assign(handle, content);
};

const UploadFiles = () => {
  const [selectedFiles, setSelectedFiles] = useState(undefined);
  const [progressInfos, setProgressInfos] = useState({ val: [] });
  const [message, setMessage] = useState([]);
  const [fileInfos, setFileInfos] = useState([]);
  const [dragging, setDragging] = useState(false);
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
    dragging,
    setDragging,
    progressInfosRef,
  });

  const { Progress, FileControls, Messages, FileList } = handle.components;

  handle.sideEffects.useGetFiles();

  return (
    <div>
      <Progress />
      <FileControls />
      <Messages />
      <FileList {...{ handle: handle.events }} />
    </div>
  );
};

export default UploadFiles;
