// @ts-check
import fs from "fs";
import gulp from "gulp";
import through2 from "through2";
import del from "del";

function clean() {
  return del("{lib,addon,keymap,mode}");
}

function js() {
  return gulp
    .src(["node_modules/codemirror/{lib,addon,keymap,mode}/**/*"])
    .pipe(
      through2.obj((/** @type {import("vinyl")} */ file, _, cb) => {
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
    .pipe(gulp.dest("."));
}

function dts() {
  const importDeclare = "import * as CodeMirror from 'codemirror'";

  return gulp
    .src(["node_modules/codemirror/{addon,keymap,mode}/**/*"])
    .pipe(
      through2.obj((/** @type {import("vinyl")} */ file, _, cb) => {
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
    .pipe(gulp.dest("."));
}

export default gulp.series(clean, js, dts);
