const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('=== 知识来敲门 - 打包工具 ===');
console.log('');

// 检查是否安装了必要的依赖
console.log('正在检查依赖...');

if (!fs.existsSync(path.join(__dirname, 'node_modules'))) {
  console.log('未检测到依赖，正在安装...');
  
  exec('npm install', (error, stdout, stderr) => {
    if (error) {
      console.error(`安装依赖失败: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`安装依赖警告: ${stderr}`);
    }
    console.log('依赖安装完成！');
    startPackaging();
  });
} else {
  console.log('依赖检查完成！');
  startPackaging();
}

function startPackaging() {
  console.log('');
  console.log('请选择打包平台:');
  console.log('1. Windows');
  console.log('2. macOS');
  console.log('3. 两者都打包');
  
  rl.question('请输入选项 (1-3): ', (answer) => {
    switch(answer.trim()) {
      case '1':
        packageForWindows();
        break;
      case '2':
        packageForMac();
        break;
      case '3':
        packageForBoth();
        break;
      default:
        console.log('无效选项，默认为 Windows 打包');
        packageForWindows();
    }
  });
}

function packageForWindows() {
  console.log('');
  console.log('正在为 Windows 打包...');
  
  exec('npm run build-win', (error, stdout, stderr) => {
    if (error) {
      console.error(`打包失败: ${error.message}`);
      rl.close();
      return;
    }
    
    console.log('Windows 打包完成！');
    console.log(`输出目录: ${path.join(__dirname, 'dist', '知识来敲门-win32-x64')}`);
    rl.close();
  });
}

function packageForMac() {
  console.log('');
  console.log('正在为 macOS 打包...');
  
  exec('npm run build-mac', (error, stdout, stderr) => {
    if (error) {
      console.error(`打包失败: ${error.message}`);
      rl.close();
      return;
    }
    
    console.log('macOS 打包完成！');
    console.log(`输出目录: ${path.join(__dirname, 'dist', '知识来敲门-darwin-x64')}`);
    rl.close();
  });
}

function packageForBoth() {
  console.log('');
  console.log('正在为 Windows 和 macOS 打包...');
  
  exec('npm run build-win && npm run build-mac', (error, stdout, stderr) => {
    if (error) {
      console.error(`打包失败: ${error.message}`);
      rl.close();
      return;
    }
    
    console.log('Windows 和 macOS 打包完成！');
    console.log(`Windows 输出目录: ${path.join(__dirname, 'dist', '知识来敲门-win32-x64')}`);
    console.log(`macOS 输出目录: ${path.join(__dirname, 'dist', '知识来敲门-darwin-x64')}`);
    rl.close();
  });
} 