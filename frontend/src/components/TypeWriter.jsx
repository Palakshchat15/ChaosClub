import { useEffect, useState } from "react";

function TypeWriter({ text, speed = 55, className = "", style = {} }) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    setDisplayed("");
    setDone(false);
    let i = 0;
    const id = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) { clearInterval(id); setDone(true); }
    }, speed);
    return () => clearInterval(id);
  }, [text, speed]);

  return (
    <span className={className} style={style}>
      {displayed}
      {!done && <span style={{ display: "inline-block", width: "2px", background: "var(--accent)", marginLeft: "2px", animation: "blink 0.7s step-end infinite", verticalAlign: "middle", height: "1em" }} />}
    </span>
  );
}

export default TypeWriter;
