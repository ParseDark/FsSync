# FsSync

FsSync is a non dependencies simple directory realtime sync tool. Will watch target directory and updata file in other dir. Keep both dir have something.


Use Case
```
deno run -A run.ts ./exampleDir/dir1 ./exampleDir/dir2
```
And then you can change anything in dir1. All file changes will update the dir2.