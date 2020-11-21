# FsSync

FsSync is a simple directory realtime sync tool. Will watch target directory and updata file in other dir. Keep both dir have samething.


Use Case
```
deno run -A run.ts ./exampleDir/dir1 ./exampleDir/dir2
```
And then you can change anything in dir1. All change will updata the dir2.