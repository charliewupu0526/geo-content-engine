
import asyncio
import os
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables
load_dotenv('.env.local')

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Error: SUPABASE_URL and SUPABASE_KEY must be set in .env.local")
    exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# SQL statements to create tables
SQL_COMMANDS = [
    """
    CREATE TABLE IF NOT EXISTS projects (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name TEXT NOT NULL,
        domain TEXT NOT NULL,
        status TEXT DEFAULT 'PROFILE_ENTRY',
        company_profile JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
    );
    """,
    """
    CREATE TABLE IF NOT EXISTS crawl_results (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
        url TEXT NOT NULL,
        content TEXT,
        metadata JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
    );
    """,
    """
    CREATE TABLE IF NOT EXISTS analysis_reports (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
        report_type TEXT NOT NULL,
        data JSONB NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
    );
    """,
    """
    CREATE TABLE IF NOT EXISTS generated_keywords (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
        keyword TEXT NOT NULL,
        data JSONB,
        source TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
    );
    """,
    """
    CREATE TABLE IF NOT EXISTS content_posts (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        content_type TEXT,
        status TEXT DEFAULT 'DRAFT',
        content TEXT,
        image_url TEXT,
        meta_data JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
    );
    """,
    """
    CREATE TABLE IF NOT EXISTS tasks (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
        batch_id TEXT,
        title TEXT NOT NULL,
        branch TEXT,
        status TEXT DEFAULT 'Pending',
        content TEXT,
        meta_data JSONB,
        publish_status TEXT DEFAULT 'Pending',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
    );
    """
]

async def run_migrations():
    print("Running Supabase migrations...")
    
    # Note: supabase-py doesn't strictly support raw SQL execution via the client 
    # unless 'rpc' function is set up or using direct connection.
    # However, for many setups, we might not have direct SQL access.
    # We will try to use the `rpc` if a 'exec_sql' function exists, 
    # otherwise we will print instructions for the user.
    
    print("\nIMPORTANT: Please run the following SQL in your Supabase SQL Editor:\n")
    for sql in SQL_COMMANDS:
        print(sql)
        print("-" * 50)

if __name__ == "__main__":
    asyncio.run(run_migrations())
