import React from "react";
import "./App.css";
import "bootstrap/dist/css/bootstrap.min.css";

import FilesUpload from "./components/FilesUpload";

function App() {
  return (
    <div className="container" style={{ width: "600px" }}>
      <div className="my-3">
        <h3>dearfrankg.com</h3>
        <h4>Multi-File Upload</h4>
      </div>

      <FilesUpload />
    </div>
  );
}

export default App;
