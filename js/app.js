// DOM元素
const totalStudentsInput = document.getElementById('total-students');
const studentsToPickInput = document.getElementById('students-to-pick');
const pickNumberDisplay = document.getElementById('pick-number');
const startBtn = document.getElementById('start-btn');
const resetBtn = document.getElementById('reset-btn');
const resultContainer = document.getElementById('result-container');
const historyContainer = document.getElementById('history-container');
const allPickedMessage = document.getElementById('all-picked-message');

// 班级管理相关元素
const classSelect = document.getElementById('class-select');
const classInfo = document.getElementById('class-info');
const addClassBtn = document.getElementById('add-class-btn');
const deleteClassBtn = document.getElementById('delete-class-btn');
const addClassModal = document.getElementById('add-class-modal');
const deleteClassModal = document.getElementById('delete-class-modal');
const newClassNameInput = document.getElementById('new-class-name');
const newClassSizeInput = document.getElementById('new-class-size');
const confirmAddClassBtn = document.getElementById('confirm-add-class');
const cancelAddClassBtn = document.getElementById('cancel-add-class');
const confirmDeleteClassBtn = document.getElementById('confirm-delete-class');
const cancelDeleteClassBtn = document.getElementById('cancel-delete-class');

// 数据管理相关元素
const exportDataBtn = document.getElementById('export-data-btn');
const importDataBtn = document.getElementById('import-data-btn');
const importFileInput = document.getElementById('import-file-input');
const resetDataModal = document.getElementById('reset-data-modal');
const confirmResetDataBtn = document.getElementById('confirm-reset-data');
const cancelResetDataBtn = document.getElementById('cancel-reset-data');

// 状态变量
let isPickingInProgress = false;
let pickedStudents = [];
let allHistory = [];
let animationInterval;
let availableStudents = []; // 存储可用的学生号码
let currentClassId = null; // 当前选中的班级ID

// 班级数据结构
const CLASS_STORAGE_KEY = 'knowledge-knocking-classes';
let classes = []; // 存储所有班级信息

// 初始化
function init() {
    // 加载班级数据
    loadClasses();
    
    // 更新抽取人数显示
    studentsToPickInput.addEventListener('input', function() {
        pickNumberDisplay.textContent = this.value;
    });

    // 监听班级总人数变化
    totalStudentsInput.addEventListener('change', function() {
        if (!currentClassId) return;
        
        // 更新当前班级的总人数
        const currentClass = getClassById(currentClassId);
        if (currentClass) {
            currentClass.totalStudents = parseInt(totalStudentsInput.value);
            saveClasses();
        }
        
        // 获取当前已抽取的学生
        const pickedStudentSet = new Set(allHistory.flatMap(item => item.students));
        
        // 重置可用学生列表
        const totalStudents = parseInt(totalStudentsInput.value);
        availableStudents = [];
        
        // 只添加未被抽取的学生到可用列表
        for (let i = 1; i <= totalStudents; i++) {
            if (!pickedStudentSet.has(i)) {
                availableStudents.push(i);
            }
        }
        
        // 如果班级总人数小于当前设置的抽取人数，调整抽取人数
        const currentPickCount = parseInt(studentsToPickInput.value);
        if (totalStudents < currentPickCount) {
            studentsToPickInput.value = totalStudents;
            pickNumberDisplay.textContent = totalStudents;
        }
        
        // 更新结果容器
        updateResultContainer();
        
        // 如果没有可用学生，显示提示
        if (availableStudents.length === 0 && totalStudents > 0) {
            allPickedMessage.classList.remove('hidden');
        } else {
            allPickedMessage.classList.add('hidden');
        }
        
        // 更新班级信息显示
        updateClassInfo();
        
        // 记录日志
        console.log(`班级总人数已更改为 ${totalStudents}，当前可用学生数量: ${availableStudents.length}`);
    });

    // 班级选择变化
    classSelect.addEventListener('change', function() {
        switchClass(this.value);
    });
    
    // 添加班级按钮
    addClassBtn.addEventListener('click', function() {
        showAddClassModal();
    });
    
    // 删除班级按钮
    deleteClassBtn.addEventListener('click', function() {
        if (!currentClassId) {
            alert('请先选择一个班级');
            return;
        }
        showDeleteClassModal();
    });
    
    // 确认添加班级
    confirmAddClassBtn.addEventListener('click', function() {
        addNewClass();
    });
    
    // 取消添加班级
    cancelAddClassBtn.addEventListener('click', function() {
        hideAddClassModal();
    });
    
    // 确认删除班级
    confirmDeleteClassBtn.addEventListener('click', function() {
        deleteCurrentClass();
    });
    
    // 取消删除班级
    cancelDeleteClassBtn.addEventListener('click', function() {
        hideDeleteClassModal();
    });
    
    // 导出数据按钮
    exportDataBtn.addEventListener('click', function() {
        exportData();
    });
    
    // 导入数据按钮
    importDataBtn.addEventListener('click', function() {
        importFileInput.click();
    });
    
    // 导入文件选择
    importFileInput.addEventListener('change', function(event) {
        if (event.target.files.length > 0) {
            importData(event.target.files[0]);
        }
    });
    
    // 重置数据按钮
    resetBtn.addEventListener('click', function() {
        if (!currentClassId) {
            alert('请先选择一个班级');
            return;
        }
        showResetDataModal();
    });
    
    // 确认重置数据
    confirmResetDataBtn.addEventListener('click', function() {
        actuallyResetData();
        hideResetDataModal();
    });
    
    // 取消重置数据
    cancelResetDataBtn.addEventListener('click', function() {
        hideResetDataModal();
    });

    // 绑定按钮事件
    startBtn.addEventListener('click', startPicking);

    // 初始化界面
    updateClassSelect();
    
    // 如果有班级，选择第一个班级
    if (classes.length > 0) {
        classSelect.value = classes[0].id;
        switchClass(classes[0].id);
    } else {
        // 禁用相关按钮
        disablePickingControls();
    }

    // 显示当前可用学生数量（调试用，可以在生产环境中移除）
    console.log(`初始化完成，当前可用学生数量: ${availableStudents.length}`);
}

// 加载班级数据
function loadClasses() {
    const savedClasses = localStorage.getItem(CLASS_STORAGE_KEY);
    if (savedClasses) {
        classes = JSON.parse(savedClasses);
        console.log('已加载班级数据:', classes);
    }
}

// 保存班级数据
function saveClasses() {
    localStorage.setItem(CLASS_STORAGE_KEY, JSON.stringify(classes));
    console.log('已保存班级数据:', classes);
}

// 获取班级通过ID
function getClassById(id) {
    return classes.find(c => c.id === id);
}

// 更新班级选择下拉框
function updateClassSelect() {
    // 保存当前选择
    const currentValue = classSelect.value;
    
    // 清空选项
    classSelect.innerHTML = '<option value="">-- 请选择班级 --</option>';
    
    // 添加班级选项
    classes.forEach(cls => {
        const option = document.createElement('option');
        option.value = cls.id;
        option.textContent = cls.name;
        classSelect.appendChild(option);
    });
    
    // 恢复选择
    if (currentValue && classes.some(c => c.id === currentValue)) {
        classSelect.value = currentValue;
    }
}

// 切换班级
function switchClass(classId) {
    if (isPickingInProgress) {
        alert('正在抽取中，请等待抽取完成后再切换班级');
        classSelect.value = currentClassId;
        return;
    }
    
    // 如果没有选择班级
    if (!classId) {
        currentClassId = null;
        disablePickingControls();
        clearDisplay();
        return;
    }
    
    const selectedClass = getClassById(classId);
    if (!selectedClass) {
        console.error('找不到班级:', classId);
        return;
    }
    
    // 保存当前班级数据（如果有）
    if (currentClassId) {
        saveCurrentClassData();
    }
    
    // 切换到新班级
    currentClassId = classId;
    
    // 加载班级数据
    totalStudentsInput.value = selectedClass.totalStudents;
    allHistory = selectedClass.history || [];
    
    // 计算可用学生
    const pickedStudentSet = new Set(allHistory.flatMap(item => item.students));
    availableStudents = [];
    for (let i = 1; i <= selectedClass.totalStudents; i++) {
        if (!pickedStudentSet.has(i)) {
            availableStudents.push(i);
        }
    }
    
    // 更新界面
    updateResultContainer();
    updateHistoryDisplay();
    updateClassInfo();
    
    // 启用控件
    enablePickingControls();
    
    // 检查是否所有学生都已被抽取
    if (availableStudents.length === 0 && selectedClass.totalStudents > 0) {
        allPickedMessage.classList.remove('hidden');
    } else {
        allPickedMessage.classList.add('hidden');
    }
    
    console.log(`已切换到班级: ${selectedClass.name}, 总人数: ${selectedClass.totalStudents}, 可用学生: ${availableStudents.length}`);
}

// 保存当前班级数据
function saveCurrentClassData() {
    if (!currentClassId) return;
    
    const currentClass = getClassById(currentClassId);
    if (currentClass) {
        currentClass.totalStudents = parseInt(totalStudentsInput.value);
        currentClass.history = allHistory;
        saveClasses();
    }
}

// 显示添加班级模态框
function showAddClassModal() {
    newClassNameInput.value = '';
    newClassSizeInput.value = '55';
    addClassModal.classList.remove('hidden');
}

// 隐藏添加班级模态框
function hideAddClassModal() {
    addClassModal.classList.add('hidden');
}

// 显示删除班级模态框
function showDeleteClassModal() {
    deleteClassModal.classList.remove('hidden');
}

// 隐藏删除班级模态框
function hideDeleteClassModal() {
    deleteClassModal.classList.add('hidden');
}

// 添加新班级
function addNewClass() {
    const name = newClassNameInput.value.trim();
    const size = parseInt(newClassSizeInput.value);
    
    if (!name) {
        alert('请输入班级名称');
        return;
    }
    
    if (isNaN(size) || size <= 0 || size > 100) {
        alert('班级人数必须在1-100之间');
        return;
    }
    
    // 检查班级名称是否已存在
    if (classes.some(c => c.name === name)) {
        alert('班级名称已存在，请使用其他名称');
        return;
    }
    
    // 创建新班级
    const newClass = {
        id: 'class_' + Date.now(),
        name: name,
        totalStudents: size,
        history: []
    };
    
    // 添加到班级列表
    classes.push(newClass);
    
    // 保存班级数据
    saveClasses();
    
    // 更新班级选择下拉框
    updateClassSelect();
    
    // 切换到新班级
    classSelect.value = newClass.id;
    switchClass(newClass.id);
    
    // 隐藏模态框
    hideAddClassModal();
    
    console.log(`已添加新班级: ${name}, 总人数: ${size}`);
}

// 删除当前班级
function deleteCurrentClass() {
    if (!currentClassId) return;
    
    // 从班级列表中移除
    classes = classes.filter(c => c.id !== currentClassId);
    
    // 保存班级数据
    saveClasses();
    
    // 更新班级选择下拉框
    updateClassSelect();
    
    // 重置当前班级
    currentClassId = null;
    allHistory = [];
    availableStudents = [];
    
    // 如果还有班级，选择第一个
    if (classes.length > 0) {
        classSelect.value = classes[0].id;
        switchClass(classes[0].id);
    } else {
        // 清空显示
        clearDisplay();
        // 禁用相关按钮
        disablePickingControls();
    }
    
    // 隐藏模态框
    hideDeleteClassModal();
    
    console.log('已删除班级');
}

// 清空显示
function clearDisplay() {
    totalStudentsInput.value = '55';
    allHistory = [];
    availableStudents = [];
    updateResultContainer();
    updateHistoryDisplay();
    classInfo.innerHTML = '<p class="text-center text-gray-400 italic">请先选择或添加班级</p>';
    allPickedMessage.classList.add('hidden');
}

// 禁用抽取相关控件
function disablePickingControls() {
    totalStudentsInput.disabled = true;
    studentsToPickInput.disabled = true;
    startBtn.disabled = true;
    resetBtn.disabled = true;
    deleteClassBtn.disabled = true;
    
    startBtn.classList.add('opacity-50', 'cursor-not-allowed');
    resetBtn.classList.add('opacity-50', 'cursor-not-allowed');
    deleteClassBtn.classList.add('opacity-50', 'cursor-not-allowed');
}

// 启用抽取相关控件
function enablePickingControls() {
    totalStudentsInput.disabled = false;
    studentsToPickInput.disabled = false;
    startBtn.disabled = false;
    resetBtn.disabled = false;
    deleteClassBtn.disabled = false;
    
    startBtn.classList.remove('opacity-50', 'cursor-not-allowed');
    resetBtn.classList.remove('opacity-50', 'cursor-not-allowed');
    deleteClassBtn.classList.remove('opacity-50', 'cursor-not-allowed');
}

// 更新班级信息显示
function updateClassInfo() {
    if (!currentClassId) {
        classInfo.innerHTML = '<p class="text-center text-gray-400 italic">请先选择或添加班级</p>';
        return;
    }
    
    const currentClass = getClassById(currentClassId);
    if (!currentClass) return;
    
    const totalStudents = currentClass.totalStudents;
    const pickedCount = new Set(allHistory.flatMap(item => item.students)).size;
    const remainingCount = availableStudents.length;
    
    classInfo.innerHTML = `
        <div class="flex flex-wrap gap-4">
            <div class="bg-blue-100 rounded-lg px-3 py-2">
                <span class="text-sm text-gray-600">总人数:</span>
                <span class="text-lg font-semibold text-blue-700 ml-1">${totalStudents}</span>
            </div>
            <div class="bg-green-100 rounded-lg px-3 py-2">
                <span class="text-sm text-gray-600">已抽取:</span>
                <span class="text-lg font-semibold text-green-700 ml-1">${pickedCount}</span>
            </div>
            <div class="bg-yellow-100 rounded-lg px-3 py-2">
                <span class="text-sm text-gray-600">未抽取:</span>
                <span class="text-lg font-semibold text-yellow-700 ml-1">${remainingCount}</span>
            </div>
            <div class="bg-purple-100 rounded-lg px-3 py-2">
                <span class="text-sm text-gray-600">抽取进度:</span>
                <span class="text-lg font-semibold text-purple-700 ml-1">${totalStudents > 0 ? Math.round((pickedCount / totalStudents) * 100) : 0}%</span>
            </div>
        </div>
    `;
}

// 更新历史记录显示
function updateHistoryDisplay() {
    if (allHistory.length > 0) {
        historyContainer.innerHTML = '';
        
        allHistory.forEach(item => {
            const historyEntry = document.createElement('div');
            historyEntry.className = 'bg-white rounded p-3 mb-2 shadow-sm';
            
            const studentsList = item.students.map(num => `<span class="inline-block bg-blue-100 text-blue-600 rounded-full px-2 py-1 text-xs font-semibold mr-1 mb-1">${num}号</span>`).join('');
            
            historyEntry.innerHTML = `
                <div class="flex justify-between items-center mb-2">
                    <span class="text-xs text-gray-500">${item.timestamp}</span>
                    <span class="text-xs text-blue-500">抽取了 ${item.students.length} 人</span>
                </div>
                <div class="flex flex-wrap">${studentsList}</div>
            `;
            
            historyContainer.appendChild(historyEntry);
        });
    } else {
        historyContainer.innerHTML = '<p class="text-center text-gray-400 italic">暂无记录</p>';
    }
}

// 重置可用学生列表
function resetAvailableStudents() {
    if (!currentClassId) return;
    
    const totalStudents = parseInt(totalStudentsInput.value);
    // 验证输入的有效性
    if (isNaN(totalStudents) || totalStudents <= 0) {
        console.error('班级总人数无效:', totalStudentsInput.value);
        return;
    }
    
    availableStudents = [];
    for (let i = 1; i <= totalStudents; i++) {
        availableStudents.push(i);
    }
    
    // 更新班级信息
    updateClassInfo();
    
    // 记录日志（调试用，可以在生产环境中移除）
    console.log(`重置可用学生列表，当前可用学生数量: ${availableStudents.length}`);
}

// 更新结果容器
function updateResultContainer() {
    const count = parseInt(studentsToPickInput.value);
    resultContainer.innerHTML = '';
    
    for (let i = 0; i < count; i++) {
        const card = document.createElement('div');
        card.className = 'number-card bg-gray-100 rounded-lg p-4 text-center opacity-50';
        card.innerHTML = `
            <p class="text-4xl font-bold text-gray-400">?</p>
            <p class="text-sm text-gray-500 mt-1">等待抽取</p>
        `;
        resultContainer.appendChild(card);
    }
}

// 开始抽取
function startPicking() {
    if (isPickingInProgress) return;
    
    // 检查是否选择了班级
    if (!currentClassId) {
        alert('请先选择一个班级');
        return;
    }
    
    // 检查是否还有可用学生
    if (availableStudents.length === 0) {
        // 显示全部抽取完成的提示
        allPickedMessage.classList.remove('hidden');
        return;
    }
    
    // 隐藏全部抽取完成的提示
    allPickedMessage.classList.add('hidden');
    
    // 确保availableStudents是最新的
    if (availableStudents.length === 0) {
        resetAvailableStudents();
        
        // 再次检查，如果仍然没有可用学生，显示提示并返回
        if (availableStudents.length === 0) {
            allPickedMessage.classList.remove('hidden');
            return;
        }
    }
    
    isPickingInProgress = true;
    startBtn.disabled = true;
    startBtn.classList.add('opacity-50', 'cursor-not-allowed');
    
    const count = parseInt(studentsToPickInput.value);
    
    // 如果可用学生数量小于要抽取的数量，只抽取剩余的学生
    const actualCount = Math.min(count, availableStudents.length);
    
    // 记录日志（调试用，可以在生产环境中移除）
    console.log(`开始抽取，要抽取的人数: ${count}, 实际抽取人数: ${actualCount}, 当前可用学生数量: ${availableStudents.length}`);
    
    // 清空之前的结果
    pickedStudents = [];
    updateResultContainer();
    
    const cards = resultContainer.querySelectorAll('.number-card');
    let duration = 0;
    
    // 动画效果：快速切换数字
    animationInterval = setInterval(() => {
        for (let i = 0; i < actualCount; i++) {
            if (i < cards.length) {
                const randomIndex = Math.floor(Math.random() * availableStudents.length);
                const randomNum = availableStudents[randomIndex];
                cards[i].querySelector('p:first-child').textContent = randomNum;
            }
        }
        
        duration += 100;
        
        // 逐个确定最终数字
        if (duration > 1000) {
            clearInterval(animationInterval);
            finalizeResults(actualCount, cards);
        }
    }, 100);
}

// 确定最终结果
function finalizeResults(count, cards) {
    // 从可用学生中随机抽取不重复的学生
    const tempPickedStudents = [];
    
    for (let i = 0; i < count; i++) {
        if (availableStudents.length > 0) {
            const randomIndex = Math.floor(Math.random() * availableStudents.length);
            const num = availableStudents.splice(randomIndex, 1)[0]; // 从可用列表中移除并获取该学生
            tempPickedStudents.push(num);
        }
    }
    
    // 更新pickedStudents
    pickedStudents = [...tempPickedStudents];
    
    // 记录日志（调试用，可以在生产环境中移除）
    console.log(`抽取完成，抽取了 ${pickedStudents.length} 人，剩余可用学生数量: ${availableStudents.length}`);
    console.log('抽取的学生号码:', pickedStudents);
    
    // 逐个显示最终结果
    pickedStudents.forEach((num, index) => {
        setTimeout(() => {
            if (index < cards.length) {
                const card = cards[index];
                card.classList.remove('bg-gray-100', 'opacity-50');
                card.classList.add('bg-blue-100', 'highlight', 'fade-in');
                
                card.innerHTML = `
                    <p class="text-4xl font-bold text-blue-600">${num}</p>
                    <p class="text-sm text-blue-500 mt-1">号同学</p>
                `;
                
                // 播放音效（可选）
                const audio = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-positive-interface-beep-221.mp3');
                audio.volume = 0.5;
                audio.play().catch(e => console.log('音频播放失败:', e));
            }
            
            // 最后一个结果显示完成后
            if (index === pickedStudents.length - 1) {
                setTimeout(() => {
                    updateHistory();
                    resetPickingState();
                    
                    // 保存当前班级数据
                    saveCurrentClassData();
                    
                    // 更新班级信息
                    updateClassInfo();
                    
                    // 检查是否所有学生都已被抽取
                    if (availableStudents.length === 0) {
                        allPickedMessage.classList.remove('hidden');
                    }
                }, 500);
            }
        }, index * 600);
    });
}

// 更新历史记录
function updateHistory() {
    const timestamp = new Date().toLocaleTimeString();
    const historyItem = {
        timestamp: timestamp,
        students: [...pickedStudents]
    };
    
    allHistory.push(historyItem);
    
    // 更新历史记录显示
    updateHistoryDisplay();
}

// 重置抽取状态
function resetPickingState() {
    isPickingInProgress = false;
    startBtn.disabled = false;
    startBtn.classList.remove('opacity-50', 'cursor-not-allowed');
}

// 重置数据（旧版本，已被actuallyResetData替代）
function resetData() {
    console.warn('resetData函数已被弃用，请使用actuallyResetData函数');
    
    if (!currentClassId) {
        alert('请先选择一个班级');
        return;
    }
    
    if (isPickingInProgress) {
        clearInterval(animationInterval);
        resetPickingState();
    }
    
    // 清空历史记录
    allHistory = [];
    
    // 重置可用学生列表
    resetAvailableStudents();
    
    // 更新结果容器
    updateResultContainer();
    
    // 更新历史记录显示
    updateHistoryDisplay();
    
    // 隐藏全部抽取完成的提示
    allPickedMessage.classList.add('hidden');
    
    // 保存当前班级数据
    saveCurrentClassData();
    
    // 更新班级信息
    updateClassInfo();
    
    console.log("已重置所有数据，系统已重置");
}

// 显示重置数据确认模态框
function showResetDataModal() {
    resetDataModal.classList.remove('hidden');
}

// 隐藏重置数据确认模态框
function hideResetDataModal() {
    resetDataModal.classList.add('hidden');
}

// 导出数据
function exportData() {
    if (classes.length === 0) {
        alert('没有可导出的数据');
        return;
    }
    
    // 准备导出数据
    const exportData = {
        classes: classes,
        exportDate: new Date().toISOString(),
        version: '1.0'
    };
    
    // 转换为JSON字符串
    const jsonData = JSON.stringify(exportData, null, 2);
    
    // 创建Blob对象
    const blob = new Blob([jsonData], { type: 'application/json' });
    
    // 创建下载链接
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `知识来敲门数据备份_${new Date().toLocaleDateString().replace(/\//g, '-')}.json`;
    
    // 触发下载
    document.body.appendChild(a);
    a.click();
    
    // 清理
    setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, 0);
    
    console.log('数据导出成功');
}

// 导入数据
function importData(file) {
    const reader = new FileReader();
    
    reader.onload = function(event) {
        try {
            const importedData = JSON.parse(event.target.result);
            
            // 验证导入数据格式
            if (!importedData.classes || !Array.isArray(importedData.classes)) {
                throw new Error('导入的数据格式不正确');
            }
            
            // 确认导入
            if (confirm(`确定要导入这些数据吗？这将覆盖当前所有班级数据。\n导入的数据包含 ${importedData.classes.length} 个班级，导出日期: ${new Date(importedData.exportDate).toLocaleString()}`)) {
                // 备份当前数据
                const backupData = JSON.stringify(classes);
                
                try {
                    // 更新班级数据
                    classes = importedData.classes;
                    
                    // 保存到本地存储
                    saveClasses();
                    
                    // 更新界面
                    updateClassSelect();
                    
                    // 如果有班级，选择第一个班级
                    if (classes.length > 0) {
                        classSelect.value = classes[0].id;
                        switchClass(classes[0].id);
                    } else {
                        // 禁用相关按钮
                        disablePickingControls();
                        clearDisplay();
                    }
                    
                    alert('数据导入成功');
                    console.log('数据导入成功');
                } catch (error) {
                    // 恢复备份
                    classes = JSON.parse(backupData);
                    saveClasses();
                    
                    alert('导入过程中出错，已恢复原数据');
                    console.error('导入错误:', error);
                }
            }
        } catch (error) {
            alert('导入失败: ' + error.message);
            console.error('导入错误:', error);
        }
        
        // 重置文件输入
        importFileInput.value = '';
    };
    
    reader.onerror = function() {
        alert('读取文件失败');
        console.error('文件读取错误');
        importFileInput.value = '';
    };
    
    reader.readAsText(file);
}

// 实际执行重置数据操作
function actuallyResetData() {
    if (!currentClassId) {
        alert('请先选择一个班级');
        return;
    }
    
    if (isPickingInProgress) {
        clearInterval(animationInterval);
        resetPickingState();
    }
    
    // 清空历史记录
    allHistory = [];
    
    // 重置可用学生列表
    resetAvailableStudents();
    
    // 更新结果容器
    updateResultContainer();
    
    // 更新历史记录显示
    updateHistoryDisplay();
    
    // 隐藏全部抽取完成的提示
    allPickedMessage.classList.add('hidden');
    
    // 保存当前班级数据
    saveCurrentClassData();
    
    // 更新班级信息
    updateClassInfo();
    
    console.log("已重置所有数据，系统已重置");
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', init); 
