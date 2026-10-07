const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
import fs from 'node:fs';
const base=process.env.TEST_BASE_URL||'http://127.0.0.1:3007';
const credentials=JSON.parse(fs.readFileSync('.auth-dev/accounts.json','utf8')).student;
const result={checks:[],issues:[],completed:false};
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu','--disable-software-rasterizer','--disable-features=Vulkan','--no-zygote']});
try{const ctx=await browser.newContext();const p=await ctx.newPage();p.setDefaultTimeout(180000);p.on('pageerror',e=>result.issues.push(e.message));
 const login=await ctx.request.post(base+'/api/auth/login',{headers:{Origin:base},data:credentials,timeout:180000});if(login.status()!==200)throw new Error('Login failed '+login.status());
 const get=async path=>{const r=await ctx.request.get(base+path,{timeout:180000});if(r.status()!==200)throw new Error(path+': '+r.status());return r.json()};
 const [courses,assignments]=await Promise.all([get('/api/v1/student/courses'),get('/api/v1/student/assignments')]);await Promise.all([get('/api/v1/student/courses/'+courses.data.rows[0].id),get('/api/v1/student/assignments/'+assignments.data.rows[0].id)]);result.checks.push('Owned course and assignment detail APIs');console.log('PASS owned detail APIs');
 await p.goto(base+'/portal/student/settings',{timeout:180000});await p.locator('input[name=timezone]').fill('Asia/Karachi');await p.getByRole('button',{name:'Save preferences'}).click();await p.getByText('Preferences saved.',{exact:true}).waitFor();result.checks.push('Preferences save through browser');console.log('PASS browser preferences');
 await p.goto(base+'/portal/student/notifications',{timeout:180000});await p.getByRole('button',{name:'Mark all as read'}).click();await p.getByText('Saved.',{exact:true}).waitFor();result.checks.push('Mark all notifications read');console.log('PASS browser notifications');
 await p.goto(base+'/portal/student/transcript',{timeout:180000});await p.emulateMedia({media:'print'});if(await p.locator('.portal-sidebar').isVisible())throw new Error('Print sidebar visible');result.checks.push('Unofficial transcript print layout');console.log('PASS print layout');await p.emulateMedia({media:'screen'});
 await p.getByRole('button',{name:'Sign out',exact:true}).click();await p.waitForURL(base+'/login');if((await ctx.request.get(base+'/api/v1/student/dashboard',{timeout:180000})).status()!==401)throw new Error('Logout replay allowed');result.checks.push('Browser logout and protected API replay');result.completed=true;console.log('PASS browser logout');
}catch(e){result.issues.push(e.message);process.exitCode=1;console.error(e.message)}finally{fs.mkdirSync('test-results',{recursive:true});fs.writeFileSync('test-results/student-completion-results.json',JSON.stringify(result,null,2));await browser.close()}
