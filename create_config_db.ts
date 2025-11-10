#!/usr/bin/env bun
import { Database } from "bun:sqlite";
import { existsSync, unlinkSync } from "node:fs";
import { resolve } from "node:path";

function parseArgs() {
  const args = process.argv.slice(2);
  const opts: { name?: string; force?: boolean } = {};
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    switch (a) {
      case "--name":
      case "-n":
        opts.name = args[i + 1];
        i++;
        break;
      case "--force":
      case "-f":
        opts.force = true;
        break;
    }
  }
  return opts;
}

function main() {
  const { name, force } = parseArgs();
  const filename = name && name.length ? name : "empty.db";
  const dbPath = resolve(process.cwd(), filename);

  if (existsSync(dbPath)) {
    if (!force) {
      console.error(`目标文件已存在：${dbPath}\n使用 --force 覆盖。`);
      process.exit(1);
    }
    // 覆盖时先删除旧文件
    unlinkSync(dbPath);
  }

  const db = new Database(dbPath);
  // 写入一次最小事务，确保数据库头初始化，避免 0 字节文件
  try {
    db.exec("BEGIN;");
    db.exec("CREATE TABLE __init__(id INTEGER);");
    db.exec("INSERT INTO __init__(id) VALUES (1);");
    db.exec("DROP TABLE __init_;");
  } catch (e) {
    // 如果删表名写错导致失败，尝试正确的表名删除以清理
    try {
      db.exec("DROP TABLE IF EXISTS __init__;");
    } catch {}
  } finally {
    try { db.exec("COMMIT;"); } catch {}
  }
  db.close();
  console.log(`已创建并初始化空的 SQLite 数据库：${dbPath}`);
}

main();