import React from "react";
import { PrismLight as SyntaxHighlighter } from "react-syntax-highlighter";
import jsx from "react-syntax-highlighter/dist/esm/languages/prism/jsx";
import { materialDark } from "react-syntax-highlighter/dist/esm/styles/prism";

const Code = ({ children, language }) => {
  SyntaxHighlighter.registerLanguage("jsx", jsx);

  return (
    <SyntaxHighlighter className="code" language={language} style={materialDark}>
      {children}
    </SyntaxHighlighter>
  );
};

export default Code;