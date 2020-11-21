

const getAsyncGenResult = async (asyncList: any): Promise<any> => {
  const oldDir = [];

  for await (const v of asyncList) {
    oldDir.push(v);
  }

  return oldDir;
};

const getDirTree = async (basePath: string) => {
  const fullPath = basePath;
  const oldDir = Deno.readDir(fullPath);
  const oldDirResult = await getAsyncGenResult(oldDir);

  const newPromiseList = oldDirResult.map(async (item: any) => {
    const newBasePath = basePath + "/" + item.name;
    if (item.isDirectory) {
      item.children = await getDirTree(newBasePath);
    }
    item.path = newBasePath;

    return item;
  });

  const result = await Promise.all(newPromiseList);

  return result;
};

async function syncDir(tree1: any, target: string, from: string) {
  const opPromiseList = tree1.map(async (item: any) => {
    const type = item.isFile ? "file" : "dir";
    const targetPath = `${target}/${item.name}`;
    const fromPath = `${from}/${item.name}`;

    if (type === "file") {
      await Deno.copyFile(fromPath, targetPath);
    } else if (type === "dir") {
      await Deno.mkdir(targetPath, { recursive: true });
      if (item.children.length > 0) {
        const newTree = item.children;
        await syncDir(newTree, targetPath, fromPath);
      }
    }
  });
  const reslut = await Promise.all(opPromiseList);
  console.log(reslut);
}

async function compareTree(tree1: any, tree2: any, target: string) {
  const t1 = tree1.shift();

  const t2 = t1 && tree2.find((i: any) => i.name === t1.name);
  if (t1 && t2) {
    const isSameFileNode = t1.isFile && (t1.isFile === t2.isFile);
    const isSameDirNode = t1.isDirectory && (t1.isDirectory === t2.isDirectory);
    const t1IsFileT2IsDir = t1.isFile && !t2.isFile;
    const t1IsDirT2isFile = !t1.isFile && t2.isFile;

    if (isSameFileNode) {
      // updata this file
      await Deno.copyFile(t1.path, t2.path);
    }

    if (t1IsFileT2IsDir) {
      const newPath = target + "/" + t1.name;
      await Deno.remove(t2.path, { recursive: true });
      await Deno.copyFile(t1.path, newPath);
    }

    if (t1IsDirT2isFile) {
      const newPath = target + "/" + t1.name;
      await Deno.remove(t2.path, { recursive: true });
      await Deno.mkdir(newPath, { recursive: true });
      await compareTree(t1.children, [], newPath);
    }

    if (isSameDirNode) {
      await compareTree(t1.children, t2.children, t2.path);
    }
  }

  // 新增节点
  if (t1 && !t2) {
    const newPath = target + "/" + t1.name;
    if (t1.isFile) {
      await Deno.copyFile(t1.path, newPath);
    } else {
      await Deno.mkdir(newPath, { recursive: true });
      await compareTree(t1.children, [], newPath);
    }
  }

  let newTree2 = tree2;

  if (t2) {
    newTree2 = tree2.filter((item: any) => {
      return item.path !== t2.path;
    });
  }

  // 删除t2中多余的节点
  if (tree1.length === 0) {
    await Promise.all(newTree2.map(async (item: any) => {
      await Deno.remove(item.path, { recursive: true });
    }));
    return;
  }

  console.log("tree1 info", tree1, tree1.length);
  if (tree1.length > 0) {
    await compareTree(tree1, newTree2, target);
  }
}

async function init(dir1: string, dir2: string) {
  const tree1 = await getDirTree(dir1);
  syncDir(tree1, dir2, dir1);
}

async function runCompare(dir1: string, dir2: string) {
  const tree1 = await getDirTree(dir1);
  const tree2 = await getDirTree(dir2);
  try {
    await compareTree(tree1, tree2, dir2);
  } catch {
    console.log("compare error");
  }

  console.log("completed change");
}

export async function fsSync() {
  // Deno.args  
  const [dir1, dir2] = Deno.args;
  console.log("build", dir1, dir2)

  if(!dir1 || !dir2) {
    console.log("please get two path. eg: deno run FsSync.ts ./example/dir1 ./example/dir2");
    Deno.exit(1);
  }

  const watcher = Deno.watchFs(dir1);

  await init(dir1, dir2);

  const fromPath = await Deno.realPath(dir1);
  const toPath = await Deno.realPath(dir2)

  for await (const event of watcher) {
    await runCompare(fromPath, toPath);
  }
}
