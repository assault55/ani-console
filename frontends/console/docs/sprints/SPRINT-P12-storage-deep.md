# SPRINT-P12 · 存储深化

> 状态：**✅ 完成**（2026-06-25）  
> 验收：`npm run verify` 通过

## 目标

在 P6 列表级能力之上，补齐块存储、文件系统、对象存储的详情与写操作 UI。

## 交付物

| 能力 | API | 路径 |
|------|-----|------|
| 卷详情 + 快照列表/创建 | `GET /volumes/{id}`、`GET/POST .../snapshots` | `volumes/$volumeId.tsx` |
| 卷列表详情链接 | — | `volumes/index.tsx` |
| 文件系统详情 + 挂载目标 | `GET /filesystems/{id}`、`GET .../mount-targets` | `filesystems/$filesystemId.tsx` |
| 文件系统列表详情链接 | — | `filesystems/index.tsx` |
| 对象下载/删除 | `GET .../download`、`DELETE /objects/{id}` | `objects/index.tsx` |

## 验收结果

```bash
cd frontends/console && npm run verify
# codegen ✓ | tsc ✓ | 7 tests ✓ | build ✓
```

## 后续阶段

- P13 Registry + Dashboard → `SPRINT-P13-registry-dashboard.md`
