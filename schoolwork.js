
// Initialize schoolwork page
document.addEventListener('DOMContentLoaded', function() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) {
        alert('Please login first!');
        window.location.href = 'index.html';
        return;
    }

    setupSubjectTabs();
    loadAssignments();
});

function setupSubjectTabs() {
    const tabs = document.querySelectorAll('.subject-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const subject = tab.getAttribute('data-subject');
            switchSubject(subject);
        });
    });
}

function switchSubject(subject) {
    // Update active tab
    document.querySelectorAll('.subject-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelector(`[data-subject="${subject}"]`).classList.add('active');

    // Update active panel
    document.querySelectorAll('.subject-panel').forEach(panel => {
        panel.classList.remove('active');
    });
    document.getElementById(`${subject}-content`).classList.add('active');

    // Load assignments for this subject
    loadSubjectAssignments(subject);
}

function loadAssignments() {
    const subjects = ['math', 'science', 'english', 'hindi', 'sst'];
    subjects.forEach(subject => {
        loadSubjectAssignments(subject);
    });
}

function loadSubjectAssignments(subject) {
    const assignments = JSON.parse(localStorage.getItem('uploadedAssignments')) || [];
    const subjectAssignments = assignments.filter(assignment => assignment.subject === subject);
    
    const container = document.getElementById(`${subject}-assignments`);
    if (!container) return;

    if (subjectAssignments.length === 0) {
        container.innerHTML = `
            <div class="assignment-grid">
                <div class="welcome-message">
                    <div style="text-align: center; padding: 40px; color: #666;">
                        <div style="font-size: 3rem; margin-bottom: 20px;">${getSubjectIcon(subject)}</div>
                        <h3 style="color: #667eea; margin-bottom: 15px;">No ${getSubjectName(subject)} Assignments</h3>
                        <p>Assignments will appear here when uploaded by the owner.</p>
                    </div>
                </div>
            </div>
        `;
        return;
    }

    const assignmentGrid = document.createElement('div');
    assignmentGrid.className = 'assignment-grid';

    subjectAssignments.forEach(assignment => {
        const assignmentCard = document.createElement('div');
        assignmentCard.className = 'assignment-card';
        assignmentCard.innerHTML = `
            <div class="assignment-header">
                <h3>${assignment.title}</h3>
                <span class="difficulty ${assignment.difficulty}">${assignment.difficulty}</span>
            </div>
            <p class="assignment-description">${assignment.description}</p>
            <div class="assignment-meta">
                <span class="due-date">Due: ${new Date(assignment.dueDate).toLocaleDateString()}</span>
                <button onclick="downloadAssignment('${assignment.fileName}')" class="download-btn">
                    📥 Download
                </button>
            </div>
        `;
        assignmentGrid.appendChild(assignmentCard);
    });

    container.innerHTML = '';
    container.appendChild(assignmentGrid);
}

function getSubjectIcon(subject) {
    const icons = {
        math: '📊',
        science: '🔬',
        english: '📖',
        hindi: '🇮🇳',
        sst: '🌍'
    };
    return icons[subject] || '📚';
}

function getSubjectName(subject) {
    const names = {
        math: 'Mathematics',
        science: 'Science',
        english: 'English',
        hindi: 'Hindi',
        sst: 'SST'
    };
    return names[subject] || subject.charAt(0).toUpperCase() + subject.slice(1);
}

function downloadAssignment(fileName) {
    alert('Downloading ' + fileName + '...\nNote: This is a demo. In a real app, the file would download.');
    console.log('Download started for:', fileName);
}

// Add CSS for assignment cards
const style = document.createElement('style');
style.textContent = `
    .assignment-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 25px;
        padding: 20px 0;
    }

    .assignment-card {
        background: white;
        border-radius: 15px;
        padding: 25px;
        box-shadow: 0 5px 20px rgba(0, 0, 0, 0.1);
        transition: all 0.3s ease;
        border: 1px solid #e0e0e0;
    }

    .assignment-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
    }

    .assignment-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 15px;
    }

    .assignment-header h3 {
        color: #333;
        margin: 0;
        font-size: 1.3rem;
        font-weight: 600;
    }

    .difficulty {
        padding: 5px 12px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 600;
        text-transform: uppercase;
    }

    .difficulty.easy {
        background: #d4edda;
        color: #155724;
    }

    .difficulty.medium {
        background: #fff3cd;
        color: #856404;
    }

    .difficulty.hard {
        background: #f8d7da;
        color: #721c24;
    }

    .assignment-description {
        color: #666;
        line-height: 1.6;
        margin-bottom: 20px;
    }

    .assignment-meta {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .due-date {
        color: #888;
        font-size: 14px;
    }

    .download-btn {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 8px;
        cursor: pointer;
        font-weight: 600;
        transition: all 0.3s ease;
    }

    .download-btn:hover {
        transform: scale(1.05);
        box-shadow: 0 5px 15px rgba(102, 126, 234, 0.3);
    }
`;
document.head.appendChild(style);
