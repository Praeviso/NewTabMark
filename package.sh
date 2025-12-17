#!/bin/bash

OUTPUT_FILE="release_package.zip"
DIST_DIR="dist" # 你的构建目录名，如果是 build 请修改这里

# 1. 检查 dist 目录是否存在
if [ ! -d "$DIST_DIR" ]; then
    echo "警告: 未找到 $DIST_DIR 目录。正在尝试运行构建命令..."
    # 如果你想自动构建，取消下面这行的注释:
    # npm run build
    
    # 再次检查
    if [ ! -d "$DIST_DIR" ]; then
        echo "错误: 依然找不到 $DIST_DIR 目录，请先执行构建。"
        exit 1
    fi
fi

echo "1/2 正在打包源码 (遵循 .gitignore)..."
# -q: 安静模式
git ls-files --cached --others --exclude-standard -z | xargs -0 zip -q -r "$OUTPUT_FILE"

echo "2/2 正在追加 $DIST_DIR 目录..."
# 直接运行 zip 命令会将文件追加到现有的压缩包中
# -r: 递归目录
# -g: (Grow) 追加文件到现有压缩包 (zip 默认行为其实就是追加/更新，但显式说明更清晰)
zip -r -g "$OUTPUT_FILE" "$DIST_DIR"

echo "✅ 打包完成: $OUTPUT_FILE"
ls -lh "$OUTPUT_FILE"