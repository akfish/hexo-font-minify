import { getOptions } from "./option";
import _ from "underscore";
import Promise from "bluebird";
import Digest from "./digest";
import NamedLogger from "./logger";
import path from "path";
import File from "vinyl";
import renameFontFamily from "./plugin/rename-font-family";

const Fontmin = require('fontmin');
const fs = require('hexo-fs');

export default class Generator {
  constructor(hexo) {
    this.hexo = hexo;
    this.logger = new NamedLogger(hexo.log, 'Font Minify');
    this._summaries = [];
  }
  get summaries() { return this._summaries; }
  get lastSummary() { return this._summaries[this.summaries.length - 1]; }
  register() {
    this.hexo.extend.generator.register('font-minify', this._generate.bind(this));
  }
  _generate(locals) {
    let { hexo, logger } = this,
      opts = getOptions(hexo),
      digest = Digest.build(hexo);

    logger.begin("digest")
    let summary = this._currentSummary = { cached: false };
    return digest.update()
      .tap(({text, hash}) => {
        logger.end("digest")
        logger.info(`Found ${text.length} unique characters. Hash = ${hash}`);
        summary.text = text;
        summary.hash = hash;
        logger.begin("minify")
      })
      .then((d) => this._cachedMinify(d, opts))
      .tap((routes) => {
        logger.end("minify");
        summary.routes = routes;
        summary.cacheBase = opts.cacheBase;
        this._summaries.push(summary);
      });

  }
  _cachedMinify(d, opts) {
    let { logger } = this;

    let { text, hash } = d,
      { cacheBase } = opts;

    let cacheDir = path.resolve(cacheBase, hash),
      cacheHit = fs.existsSync(cacheDir);

    opts.cacheDir = cacheDir;

    if (cacheHit) {
      logger.info("Cache hit. Loading from cache.");
      this._currentSummary.cached = true;
      return this._generateFromCache(d, opts);
    } else {
      return this._generateFromDigest(d, opts);
    }
  }
  _generateFromCache(d, { cacheDir, urlBase }) {
    return fs.listDir(cacheDir).then((files) => files.map((f) => ({
        path: path.join(urlBase, f),
        data: () => fs.createReadStream(path.join(cacheDir, f))
      })
    ));
  }
  _generateFromDigest({ text, hash }, opts) {
    // Polyfill for font-family transform
    // Deprecate once https://github.com/ecomfe/fontmin/pull/29 is merged
    let cssOpts = _.clone(opts.css),
      { fontFamily } = cssOpts,
      useFontFamilyTransform = typeof fontFamily === 'function';

    // #29
    if (useFontFamilyTransform) {
      opts.css = _.omit(cssOpts, 'fontFamily');
    }

    let fontmin = new Fontmin()
      .src(opts.src)
      .use(Fontmin.glyph({ text }))
      .use(Fontmin.css(opts.css))
      .dest(opts.cacheDir);

    if (opts.eot) fontmin.use(Fontmin.ttf2eot());
    if (opts.woff) fontmin.use(Fontmin.ttf2woff());
    if (opts.svg) fontmin.use(Fontmin.ttf2svg());

    // #29
    if (useFontFamilyTransform) fontmin.use(renameFontFamily(cssOpts));

    return new Promise((resolve, reject) => {

      fontmin.run((err, files) => {
        if (err) return reject(err);

        if (opts.mergeCss) {
          let cssFiles = files.filter((f) => path.extname(f.path) === '.css');
          let base = opts.cacheDir,
            filePath = path.join(base, opts.mergeCssName),
            contents = Buffer.concat(_.pluck(cssFiles, "contents"));
          files.push(new File({
            cwd: __dirname,
            base,
            path: filePath,
            contents: contents
          }));
          fs.writeFileSync(filePath, contents);
        }

        resolve(files.map((f) => {
          let name = path.basename(f.path);
          return {
            path: path.join(opts.urlBase, name),
            data: () => f.contents
          }
        }));
      });
    });
  }
}
