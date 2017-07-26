var gulp = require("gulp");
var ts = require("gulp-typescript");
var tsProject = ts.createProject("tsconfig.json");

var paths = {
    public: [
        'public/*.html'
    ],
    assets: [
        'public/assets/**/*'
    ],
    angular: [
        'public/angular/**/*.html'
    ],
    root: [
        'package.json'
    ]
};

gulp.task("copy-root", function() {
    return gulp.src(paths.root)
        .pipe(gulp.dest("../build"));
});

gulp.task("copy-assets", function() {
    return gulp.src(paths.assets)
        .pipe(gulp.dest("../build/public/assets"));
});

gulp.task("copy-angular", function() {
    return gulp.src(paths.angular)
        .pipe(gulp.dest("../build/public/angular"));
});

gulp.task("copy-public", function() {
    return gulp.src(paths.public)
        .pipe(gulp.dest("../build/public"));
});

gulp.task("typescript", function() {
    return tsProject.src()
        .pipe(tsProject())
        .js.pipe(gulp.dest("../build"));
});

gulp.task("default", ["copy-root", "copy-public", "copy-assets", "copy-angular", "typescript"]);

gulp.task("watch", ["default"], function() {
    gulp.watch(paths.root, ["copy-root"]);
    gulp.watch(paths.public, ["copy-public"]);
    gulp.watch(paths.assets, ["copy-assets"]);
    gulp.watch(paths.angular, ["copy-angular"]);
    gulp.watch("**/*.ts", ["typescript"]);
})