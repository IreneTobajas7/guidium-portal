// Temporary in-memory comments store for testing
// This will be replaced with database functionality once the table is set up

export interface TaskComment {
  id: number;
  task_id: string;
  new_hire_id: number;
  author_name: string;
  author_email: string;
  comment_text: string;
  created_at: string;
  updated_at: string;
}

// In-memory storage
const commentsStore: TaskComment[] = [];
let nextId = 1;

// Temporary functions that will be replaced with API calls
export async function fetchTaskComments(taskId: string, newHireId: number): Promise<TaskComment[]> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 100));
  
  return commentsStore.filter(
    comment => comment.task_id === taskId && comment.new_hire_id === newHireId
  );
}

export async function addTaskComment(
  taskId: string, 
  newHireId: number, 
  authorName: string, 
  authorEmail: string, 
  commentText: string
): Promise<TaskComment | null> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 100));
  
  const newComment: TaskComment = {
    id: nextId++,
    task_id: taskId,
    new_hire_id: newHireId,
    author_name: authorName,
    author_email: authorEmail,
    comment_text: commentText,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  commentsStore.push(newComment);
  return newComment;
}

// Function to clear all comments (for testing)
export function clearComments() {
  commentsStore.length = 0;
  nextId = 1;
} 