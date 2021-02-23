import { src, dest } from "gulp";
import * as through2 from "through2";
import * as File from "vinyl";

export default () => {
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
};
