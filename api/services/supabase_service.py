"""
Supabase Service - Database operations
"""

from supabase import create_client, Client
from typing import Optional, Dict, Any, List
from datetime import datetime
from api.config import get_settings

class SupabaseService:
    """Service wrapper for Supabase database operations"""
    
    def __init__(self):
        settings = get_settings()
        self.client: Client = create_client(
            settings.supabase_url,
            settings.supabase_key
        )
    
    # ==================== Projects ====================
    
    async def get_projects(self) -> List[Dict[str, Any]]:
        """Get all projects"""
        try:
            response = self.client.table("projects").select("*").order("created_at", desc=True).execute()
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
        company_profile: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Create a new project"""
        try:
            data = {
                "name": name,
                "domain": domain,
                "status": "PROFILE_ENTRY",
                "company_profile": company_profile,
                "created_at": datetime.utcnow().isoformat()
            }
            response = self.client.table("projects").insert(data).execute()
            return response.data[0] if response.data else data
        except Exception as e:
            print(f"Error creating project: {e}")
            # Return mock data on error (for development without Supabase)
            return {
                "id": str(datetime.now().timestamp()),
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
        try:
            insert_data = {
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
        try:
            insert_data = {
                "project_id": project_id,
                **task_data,
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


# Singleton instance
_supabase_service: Optional[SupabaseService] = None

def get_supabase_service() -> SupabaseService:
    """Get or create Supabase service instance"""
    global _supabase_service
    if _supabase_service is None:
        _supabase_service = SupabaseService()
    return _supabase_service
