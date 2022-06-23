# Typescript: Compare Article Content Using Diff Utility

**Installation**

```sh
npm install

# or yarn

yarn
```


**Random Comparison**

```
npm run start
```

**Run Diff Comparison by Word**

```
npm run worddiff

# or by specific file

npm run worddiff dataset/1mdb-en-1.txt 
```

---

Optimization plan:

- use different metrics to determine similarity
- change words into their base form
- map similar meaning words into same word
