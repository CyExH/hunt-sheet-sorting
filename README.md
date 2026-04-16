# hunt-sheet-sorting
适用于
[Mathemagicians Template](https://docs.google.com/spreadsheets/d/1_ghcG3EHLsnUQ6jNx-9svD8e7T5KnkUjc-gdv5kRYn8/edit#gid=2030507275)
的 Google Sheet 脚本，便于在 Puzzle Hunt 中自动管理工作表。

### 功能
在总表 (`Overview`) 标题 (`Puzzle Name`) 列被修改时，自动为单题创建模板 (`Template`) 工作表的副本；

当在总表或题目工作表填入答案 (`Answer`) 时自动同步，并标记完成状态 (`Status` 设为 `Solved`)，之后将工作表标签更改为绿色并隐藏。

**注意**：Meta题目必须以 `[Meta]` 开头才能正常创建Meta模板 (`Meta Template`) 的副本（就算没有运用这个脚本，在使用模板时不标注也会导致 Meta 被错误地统计为 Feeder，在工作表中被展示）。

### 使用方法
在 Google Sheet 内工具栏选择 `扩展程序` → `Apps 脚本` → `文件` 右上角 `添加文件` → 选择 `脚本` → 粘贴 `hunt-sheet-sorting.gs` → Ctrl + S 保存

为了增强体验，可以直接将 Template 和 Meta Template 标签页隐藏，对脚本的工作无影响。
