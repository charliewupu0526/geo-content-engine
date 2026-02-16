"""
Supabase Service - Database operations
"""

from supabase import create_client, Client
from typing import Optional, Dict, Any, List
from datetime import datetime
from api.config import get_settings

import uuid

class SupabaseService:
    """Service wrapper for Supabase database operations"""
    
    def __init__(self):
        settings = get_settings()
        try:
            self.client: Optional[Client] = create_client(
                settings.supabase_url,
                settings.supabase_key
            )
        except Exception as e:
            print(f"Failed to initialize Supabase client: {e}")
            self.client = None
    
    # ==================== Auth ====================

    async def sign_up(self, email: str, password: str) -> Dict[str, Any]:
        """Sign up a new user"""
        if not self.client:
            return {"error": "Supabase client not initialized. Check your API keys."}
            
        try:
            response = self.client.auth.sign_up({
                "email": email,
                "password": password
            })
            return {"user": response.user, "session": response.session}
        except Exception as e:
            print(f"Error signing up: {e}")
            return {"error": str(e)}

    async def sign_in(self, email: str, password: str) -> Dict[str, Any]:
        """Sign in an existing user"""
        if not self.client:
            return {"error": "Supabase client not initialized. Check your API keys."}

        try:
            response = self.client.auth.sign_in_with_password({
                "email": email,
                "password": password
            })
            return {"user": response.user, "session": response.session}
        except Exception as e:
            print(f"Error signing in: {e}")
            return {"error": str(e)}

    # ==================== Projects ====================
    
    async def get_projects(self, user_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """Get projects, optionally filtered by user. Includes legacy projects (user_id is NULL)."""
        try:
            query = self.client.table("projects").select("*").order("created_at", desc=True)
            if user_id:
                # Fetch projects belonging to user OR legacy projects (user_id is null)
                query = query.or_(f"user_id.eq.{user_id},user_id.is.null")
            
            response = query.execute()
            return response.data
        except Exception as e:
            print(f"Error getting projects: {e}")
            return []
    
    async def get_project(self, project_id: str) -> Optional[Dict[str, Any]]:
        """Get a specific project by ID"""
        try:
            response = self.client.table("projects").select("*").eq("id", project_id).single().execute()
            return response.data
        except Exception as e:
            print(f"Error getting project {project_id}: {e}")
            return None
    
    async def create_project(
        self, 
        name: str, 
        domain: str,
        company_profile: Optional[Dict[str, Any]] = None,
        user_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Create a new project"""
        # Generate UUID locally
        project_id = str(uuid.uuid4())
        try:
            data = {
                "id": project_id,
                "name": name,
                "domain": domain,
                "status": "PROFILE_ENTRY",
                "company_profile": company_profile,
                "created_at": datetime.utcnow().isoformat()
            }
            if user_id:
                data["user_id"] = user_id
                
            response = self.client.table("projects").insert(data).execute()
            return response.data[0] if response.data else data
        except Exception as e:
            print(f"Error creating project: {e}")
            # Return mock data on error (for development without Supabase)
            return {
                "id": project_id,
                "name": name,
                "domain": domain,
                "status": "PROFILE_ENTRY",
                "company_profile": company_profile,
                "created_at": datetime.utcnow().isoformat(),
                "mock": True
            }
    
    async def update_project(
        self, 
        project_id: str, 
        update_data: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """Update a project"""
        try:
            update_data["updated_at"] = datetime.utcnow().isoformat()
            response = self.client.table("projects").update(update_data).eq("id", project_id).execute()
            return response.data[0] if response.data else None
        except Exception as e:
            print(f"Error updating project {project_id}: {e}")
            return None
    
    async def delete_project(self, project_id: str) -> bool:
        """Delete a project"""
        try:
            self.client.table("projects").delete().eq("id", project_id).execute()
            return True
        except Exception as e:
            print(f"Error deleting project {project_id}: {e}")
            return False
    
    # ==================== Crawl Results ====================
    
    async def get_crawl_results(self, project_id: str) -> List[Dict[str, Any]]:
        """Get crawl results for a project"""
        try:
            response = self.client.table("crawl_results")\
                .select("*")\
                .eq("project_id", project_id)\
                .order("created_at", desc=True)\
                .execute()
            return response.data
        except Exception as e:
            print(f"Error getting crawl results: {e}")
            return []
    
    async def save_crawl_result(
        self, 
        project_id: str, 
        data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Save a crawl result"""
        # Generate UUID locally
        result_id = str(uuid.uuid4())
        try:
            insert_data = {
                "id": result_id,
                "project_id": project_id,
                "url": data.get("url"),
                "content": data.get("content"),
                "metadata": data.get("metadata"),
                "created_at": datetime.utcnow().isoformat()
            }
            response = self.client.table("crawl_results").insert(insert_data).execute()
            return response.data[0] if response.data else insert_data
        except Exception as e:
            print(f"Error saving crawl result: {e}")
            return {"error": str(e)}
    
    # ==================== Tasks ====================
    
    async def get_tasks(self, project_id: str) -> List[Dict[str, Any]]:
        """Get all tasks for a project"""
        try:
            response = self.client.table("tasks")\
                .select("*")\
                .eq("project_id", project_id)\
                .order("created_at", desc=True)\
                .execute()
            return response.data
        except Exception as e:
            print(f"Error getting tasks: {e}")
            return []
    
    async def create_task(
        self,
        project_id: str,
        task_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Create a new task"""
        # Ensure task ID is present or generated
        task_id = task_data.get("id") or str(uuid.uuid4())
        try:
            insert_data = {
                "project_id": project_id,
                **task_data,
                "id": task_id,
                "created_at": datetime.utcnow().isoformat()
            }
            response = self.client.table("tasks").insert(insert_data).execute()
            return response.data[0] if response.data else insert_data
        except Exception as e:
            print(f"Error creating task: {e}")
            return {"error": str(e)}
    
    async def update_task(
        self,
        task_id: str,
        update_data: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """Update a task"""
        try:
            update_data["updated_at"] = datetime.utcnow().isoformat()
            response = self.client.table("tasks").update(update_data).eq("id", task_id).execute()
            return response.data[0] if response.data else None
        except Exception as e:
            print(f"Error updating task: {e}")
            return None




    # ==================== Analysis Reports ====================

    async def save_analysis_report(
        self,
        project_id: str,
        report_type: str,
        data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Save an analysis report (gap analysis, deep audit, etc)"""
        try:
            insert_data = {
                "project_id": project_id,
                "report_type": report_type,
                "data": data,
                "created_at": datetime.utcnow().isoformat()
            }
            response = self.client.table("analysis_reports").insert(insert_data).execute()
            return response.data[0] if response.data else insert_data
        except Exception as e:
            print(f"Error saving analysis report: {e}")
            return {"error": str(e)}

    async def get_analysis_reports(
        self, 
        project_id: str, 
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """Get analysis reports for a project"""
        try:
            response = self.client.table("analysis_reports")\
                .select("*")\
                .eq("project_id", project_id)\
                .order("created_at", desc=True)\
                .limit(limit)\
                .execute()
            return response.data
        except Exception as e:
            print(f"Error getting analysis reports: {e}")
            return []

    # ==================== Keywords ====================

    async def save_keywords(
        self,
        project_id: str,
        keywords: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """Save a batch of keywords"""
        if not keywords:
            return []
            
        try:
            # Prepare data for bulk insert
            insert_data = []
            timestamp = datetime.utcnow().isoformat()
            
            for k in keywords:
                insert_data.append({
                    "project_id": project_id,
                    "keyword": k.get("keyword"),
                    "data": k, 
                    "source": k.get("source", "unknown"),
                    "created_at": timestamp
                })
            
            response = self.client.table("generated_keywords").insert(insert_data).execute()
            return response.data if response.data else insert_data
        except Exception as e:
            print(f"Error saving keywords: {e}")
            return []

    async def get_keywords(
        self,
        project_id: str,
        limit: int = 500
    ) -> List[Dict[str, Any]]:
        """Get saved keywords for a project"""
        try:
            response = self.client.table("generated_keywords")\
                .select("*")\
                .eq("project_id", project_id)\
                .order("created_at", desc=True)\
                .limit(limit)\
                .execute()
            return response.data
        except Exception as e:
            print(f"Error getting keywords: {e}")
            return []

    # ==================== Content Posts ====================

    async def save_content_post(
        self,
        project_id: str,
        post_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Save a generated content post"""
        try:
            insert_data = {
                "project_id": project_id,
                "title": post_data.get("title"),
                "content_type": post_data.get("type", "Article"),
                "status": post_data.get("status", "DRAFT"),
                "content": post_data.get("full_content", ""),
                "image_url": post_data.get("image_url"),
                "meta_data": post_data.get("meta_data", {}),
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat()
            }
            response = self.client.table("content_posts").insert(insert_data).execute()
            return response.data[0] if response.data else insert_data
        except Exception as e:
            print(f"Error saving content post: {e}")
            return {"error": str(e)}

    async def get_content_posts(
        self,
        project_id: str,
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """Get content posts for a project"""
        try:
            response = self.client.table("content_posts")\
                .select("*")\
                .eq("project_id", project_id)\
                .order("created_at", desc=True)\
                .limit(limit)\
                .execute()
            return response.data
        except Exception as e:
            print(f"Error getting content posts: {e}")
            return []


# Singleton instance
_supabase_service: Optional[SupabaseService] = None

def get_supabase_service() -> SupabaseService:
    """Get or create Supabase service instance"""
    global _supabase_service
    if _supabase_service is None:
        _supabase_service = SupabaseService()
    return _supabase_service
