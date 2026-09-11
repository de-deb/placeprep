/**
 * One-off verification: runs Python reference solutions for every INTERNAL
 * problem against the proposed judge test cases via real Piston execution.
 * Only cases that pass here go into the seed. Run: npx tsx prisma/verify-cases.ts
 */
const PISTON = (process.env.PISTON_URL ?? "http://localhost:2000/api/v2").replace(/\/$/, "");

async function exec(code: string, stdin: string): Promise<string> {
  const res = await fetch(`${PISTON}/execute`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ language: "python", version: "*", files: [{ content: code }], stdin, run_timeout: 2000 }),
  });
  if (!res.ok) throw new Error(`piston ${res.status}`);
  const b = (await res.json()) as { compile?: { code: number }; run: { stdout: string; stderr: string; code: number } };
  if (b.compile && b.compile.code !== 0) throw new Error("reference failed to compile?!");
  if (b.run.code !== 0) throw new Error(`reference crashed: ${b.run.stderr}`);
  return b.run.stdout;
}

function norm(s: string) {
  return s.split("\n").map((l) => l.replace(/[ \t]+$/, "")).join("\n").replace(/\n+$/, "");
}

const REFS: Record<string, string> = {
  two_sum: `import sys
def main():
    d=sys.stdin.read().strip().split()
    if not d: return
    n=int(d[0]); a=list(map(int,d[1:1+n])); t=int(d[1+n])
    seen={}
    for i,x in enumerate(a):
        if t-x in seen: print(seen[t-x],i); return
        seen[x]=i
main()`,
  valid_paren: `import sys
def main():
    s=sys.stdin.read().strip()
    st=[]; m={')':'(',']':'[','}':'{'}
    for c in s:
        if c in '([{': st.append(c)
        elif not st or st.pop()!=m[c]: print("false"); return
    print("true" if not st else "false")
main()`,
  stock: `import sys
def main():
    d=list(map(int,sys.stdin.read().split()))
    if len(d)<2: print(0); return
    p=d[1:]; mn=p[0]; best=0
    for x in p[1:]: best=max(best,x-mn); mn=min(mn,x)
    print(best)
main()`,
  merge: `import sys
def main():
    d=list(map(int,sys.stdin.read().split()))
    if not d: return
    n=d[0]; iv=sorted(zip(d[1::2],d[2::2]))
    out=[]
    for s,e in iv:
        if out and s<=out[-1][1]: out[-1][1]=max(out[-1][1],e)
        else: out.append([s,e])
    print("\\n".join(f"{s} {e}" for s,e in out))
main()`,
  lru: `import sys
from collections import OrderedDict
def main():
    lines=sys.stdin.read().strip().split("\\n")
    cap=int(lines[0]); m=int(lines[1]); out=[]; c=OrderedDict()
    for i in range(2,2+m):
        p=lines[i].split()
        if p[0]=="put":
            k,v=int(p[1]),int(p[2])
            if k in c: del c[k]
            c[k]=v
            if len(c)>cap: c.popitem(last=False)
        else:
            k=int(p[1])
            if k in c: c.move_to_end(k); out.append(str(c[k]))
            else: out.append("-1")
    print("\\n".join(out))
main()`,
  islands: `import sys
sys.setrecursionlimit(1000000)
def main():
    d=sys.stdin.read().split()
    m,n=int(d[0]),int(d[1]); g=d[2:]; cnt=0
    vis=[[0]*n for _ in range(m)]
    def dfs(i,j):
        if i<0 or j<0 or i>=m or j>=n or vis[i][j] or g[i][j]!="1": return
        vis[i][j]=1
        dfs(i+1,j);dfs(i-1,j);dfs(i,j+1);dfs(i,j-1)
    for i in range(m):
        for j in range(n):
            if g[i][j]=="1" and not vis[i][j]: dfs(i,j); cnt+=1
    print(cnt)
main()`,
  reverse_ll: `import sys
def main():
    d=sys.stdin.read().split()
    if not d or d[0]=="0": print(""); return
    a=list(map(int,d[1:]))
    print(" ".join(map(str,a[::-1])))
main()`,
  inorder: `import sys
from collections import deque
def build(a):
    if not a or a[0]=="null": return None
    root=[a[0],None,None]; q=deque([root]); i=1
    while q and i<len(a):
        node=q.popleft()
        if i<len(a) and a[i]!="null":
            node[1]=[a[i],None,None]; q.append(node[1])
        i+=1
        if i<len(a) and a[i]!="null":
            node[2]=[a[i],None,None]; q.append(node[2])
        i+=1
    return root
def ino(t,out):
    if not t: return
    ino(t[1],out); out.append(t[0]); ino(t[2],out)
def main():
    a=sys.stdin.read().split()
    out=[]; ino(build(a),out); print(" ".join(out))
main()`,
  longest_sub: `import sys
def main():
    s="".join(sys.stdin.read().split("\\n"))
    last={}; st=0; best=0
    for i,c in enumerate(s):
        if c in last and last[c]>=st: st=last[c]+1
        last[c]=i; best=max(best,i-st+1)
    print(best)
main()`,
  knapsack: `import sys
def main():
    d=list(map(int,sys.stdin.read().split()))
    n,W=d[0],d[1]; w=d[2:2+n]; v=d[2+n:2+2*n]
    dp=[0]*(W+1)
    for i in range(n):
        for c in range(W,w[i]-1,-1): dp[c]=max(dp[c],dp[c-w[i]]+v[i])
    print(dp[W])
main()`,
  median: `import sys
def fmt(x):
    return str(int(x)) if x==int(x) else str(x)
def main():
    lines=[l for l in sys.stdin.read().split("\\n")]
    a=list(map(float,lines[0].split())) if lines and lines[0].strip() else []
    b=list(map(float,lines[1].split())) if len(lines)>1 and lines[1].strip() else []
    m=sorted(a+b); n=len(m)
    print(fmt((m[n//2]+m[(n-1)//2])/2))
main()`,
  cycle: `import sys
sys.setrecursionlimit(100000)
def main():
    d=list(map(int,sys.stdin.read().split()))
    V,E=d[0],d[1]; g=[[] for _ in range(V)]
    e=d[2:]
    for i in range(0,len(e)-1,2):
        if e[i]<V and e[i+1]<V: g[e[i]].append(e[i+1])
    col=[0]*V
    def dfs(u):
        col[u]=1
        for v in g[u]:
            if col[v]==1: return True
            if col[v]==0 and dfs(v): return True
        col[u]=2; return False
    print("true" if any(dfs(i) for i in range(V) if col[i]==0) else "false")
main()`,
};

const CASES: Record<string, [string, string, boolean][]> = {
  two_sum: [["4\n2 7 11 15\n9", "0 1", true], ["3\n3 2 4\n6", "1 2", false], ["2\n3 3\n6", "0 1", false]],
  valid_paren: [["()[]{}", "true", true], ["(]", "false", false], ["([)]", "false", false]],
  stock: [["6\n7 1 5 3 6 4", "5", true], ["5\n7 6 4 3 1", "0", false], ["1\n5", "0", false]],
  merge: [["4\n1 3\n2 6\n8 10\n15 18", "1 6\n8 10\n15 18", true], ["2\n1 4\n4 5", "1 5", false], ["3\n1 2\n3 4\n5 6", "1 2\n3 4\n5 6", false]],
  lru: [["2\n3\nput 1 1\nput 2 2\nget 1", "1", true], ["2\n5\nput 1 1\nput 2 2\nget 1\nput 3 3\nget 2", "1\n-1", false], ["1\n4\nput 2 1\nget 2\nput 3 2\nget 2", "1\n-1", false]],
  islands: [["4 5\n11110\n11010\n11000\n00000", "1", true], ["3 3\n110\n110\n001", "2", false], ["1 1\n0", "0", false]],
  reverse_ll: [["5\n1 2 3 4 5", "5 4 3 2 1", true], ["1\n7", "7", false], ["0", "", false]],
  inorder: [["1 null 2 3", "1 3 2", true], ["3 9 20 null null 15 7", "9 3 15 20 7", false], ["1", "1", false]],
  longest_sub: [["abcabcbb", "3", true], ["bbbbb", "1", false], ["pwwkew", "3", false]],
  knapsack: [["3 4\n4 5 1\n1 2 3", "3", true], ["4 7\n1 3 4 5\n1 4 5 7", "9", false], ["1 10\n5\n10", "10", false]],
  median: [["1 3\n2", "2", true], ["1 2\n3 4", "2.5", false], ["0\n0", "0", false]],
  cycle: [["2 2\n0 1\n1 0", "true", true], ["3 2\n0 1\n1 2", "false", false], ["3 3\n0 1\n1 2\n2 0", "true", false]],
};

async function main() {
  let pass = 0, fail = 0;
  for (const [key, cases] of Object.entries(CASES)) {
    for (const [input, expected, sample] of cases) {
      try {
        const out = await exec(REFS[key], input);
        if (norm(out) === norm(expected)) { pass++; }
        else { fail++; console.log(`FAIL ${key} sample=${sample}: got ${JSON.stringify(out)} want ${JSON.stringify(expected)}`); }
      } catch (e) {
        fail++; console.log(`ERROR ${key}: ${(e as Error).message}`);
      }
    }
  }
  console.log(`\n${pass} passed, ${fail} failed`);
  if (fail > 0) process.exit(1);
}

main();
