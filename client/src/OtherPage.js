import React, { useState } from "react";
import { Link } from "react-router-dom";

const OtherPage = () => {
  const [data, setData] = useState(null);

  console.log("data", data);

  return (
    <div>
      Im some other page!
      <Link to="/">Go back home</Link>
      <button onClick={() => {
        fetch("/api/")
          .then(res => res.json())
          .then(data => setData(data))
          .catch(err => console.log(err));
      }}>Say hi to server</button>
      {data?.response && <div>{data.response}</div>}
    </div>
  );
};

export default OtherPage;
