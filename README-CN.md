# json2csd

> CocosStudio 导出的 .json 文件转回源文件 .csd 文件,便于重新编辑,用于修复丢失源文件的 UI 工程文件


## 步骤

1. npm i

2. 建立 src 目录将发布后的 json 工程文件复制到该目录

3. node index.js

4. 成功后会在当前 output 目录生成，建立一个新的 CocosStudio 工程文件，删除工程里面的文件，将生成目录的文件全部拖到资源路径即可


## TODO

指定路径还未做测试

## 已知问题

如果用到了 CocosStudio 的自带合图功能，即工程里面是小图，然后发布后会自动合图，还原的时候并没有将图还原，而是转成了 plist 合图
