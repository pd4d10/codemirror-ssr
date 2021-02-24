import * as fs from "fs";
import { src, dest, series } from "gulp";
import * as through2 from "through2";
import * as File from "vinyl";
import * as del from "del";

function clean() {
  return del("{lib,addon,keymap,mode}");
}

function js() {
  return src(["node_modules/codemirror/{lib,addon,keymap,mode}/**/*"])
    .pipe(
      through2.obj((file: File, _, cb) => {
        if (file.isBuffer() && file.extname === ".js") {
          let code = file.contents.toString();

          if (file.basename === "codemirror.js") {
            code = code
              .replace(/\(function[\s\S]*?this,/, "module.exports=")
              .replace("})));", "})");
          } else {
            code = code.replace(/\(function[\s\S]*?\n\}\)/, "module.exports=");
          }

          file.contents = Buffer.from(code);
        }

        cb(null, file);
      })
    )
    .pipe(dest("."));
}

function dts() {
  const importDeclare = "import * as CodeMirror from 'codemirror'";

  return src(["node_modules/codemirror/{addon,keymap,mode}/**/*"])
    .pipe(
      through2.obj((file: File, _, cb) => {
        if (file.isBuffer() && file.extname === ".js") {
          let code = "";

          const dtsFilePath = file.path
            .replace(
              "node_modules/codemirror",
              "node_modules/@types/codemirror"
            )
            .replace(/\.js$/, ".d.ts");
          if (fs.existsSync(dtsFilePath)) {
            code += fs.readFileSync(dtsFilePath, "utf-8"); //+ "\n\n" + code;
          }

          if (!code.includes(importDeclare)) {
            code += importDeclare;
          }

          code += `
declare const use: (cm: typeof CodeMirror) => void;
export = use;
`;
          file.extname = ".d.ts";
          file.contents = Buffer.from(code);
        }

        cb(null, file);
      })
    )
    .pipe(dest("."));
}

export default series(clean, js, dts);
