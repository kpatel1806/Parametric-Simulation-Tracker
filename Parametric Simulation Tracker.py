import streamlit as st
import pandas as pd
import plotly.express as px
import google.generativeai as genai
import datetime

# --- CONFIGURATION & CONSTANTS ---
st.set_page_config(page_title="ParametricPlan.ai", page_icon="🏢", layout="wide")

# Constants translated from your React constants.ts
LOCATIONS = [
    {'id': '1A', 'city': 'Miami, FL', 'zone': 'ASHRAE 1A'},
    {'id': '1B', 'city': 'Phoenix, AZ', 'zone': 'ASHRAE 1B'},
    {'id': '2A', 'city': 'Houston, TX', 'zone': 'ASHRAE 2A'},
    {'id': '3C', 'city': 'Los Angeles, CA', 'zone': 'ASHRAE 3C'},
    {'id': '4B', 'city': 'Denver, CO', 'zone': 'ASHRAE 4B'},
    {'id': '4C', 'city': 'Seattle, WA', 'zone': 'ASHRAE 4C'},
    {'id': '5A', 'city': 'Chicago, IL', 'zone': 'ASHRAE 5A'},
    {'id': '5B', 'city': 'Calgary, AB', 'zone': 'ASHRAE 5B'},
    {'id': '6A', 'city': 'Minneapolis, MN', 'zone': 'ASHRAE 6A'},
    {'id': '7A', 'city': 'Winnipeg, MB', 'zone': 'ASHRAE 7A'},
    {'id': '7B', 'city': 'Whitehorse, YT', 'zone': 'ASHRAE 7B'},
    {'id': '8', 'city': 'Resolute, NU', 'zone': 'ASHRAE 8'},
]

ARCHETYPES = [
    {'id': 'OFFICE', 'name': 'Office Building'},
    {'id': 'MURB', 'name': 'Multi-Unit Residential'},
    {'id': 'RETAIL', 'name': 'Retail Store'},
    {'id': 'SCHOOL', 'name': 'School'},
    {'id': 'HOSPITAL', 'name': 'Hospital'},
]

# Simplified Layout logic for Python
LAYOUTS = ['Layout 1 (Standard)', 'Layout 2 (Tall/Narrow)', 'Layout 3 (Short/Wide)']

HVAC_SYSTEMS = [
    'S1: Boiler + PTAC', 'S2: Furnace + AC', 'S3: Furnace Only',
    'S4: Electric AHU', 'S12: PTHP + Elec', 'S13: PTHP + Boiler',
    'S14: SZHP + Elec', 'S19: WSHP + Boiler', 'S21: VRF + Boiler'
]

PERMUTATIONS_PER_BATCH = 81  # 3 Walls * 3 Roofs * 3 Windows * 3 Infiltration

# --- SESSION STATE MANAGEMENT ---
if 'data' not in st.session_state:
    # Initialize the "Database"
    rows = []
    batch_id = 1
    for arch in ARCHETYPES:
        for layout in LAYOUTS:
            for loc in LOCATIONS:
                for hvac in HVAC_SYSTEMS:
                    # Randomly simulate some initial progress for demo
                    import random
                    status = "PENDING"
                    if random.random() > 0.95: status = "FAILED"
                    elif random.random() > 0.90: status = "COMPLETED"
                    elif random.random() > 0.85: status = "RUNNING"
                    
                    rows.append({
                        "Batch ID": f"BATCH-{batch_id}",
                        "Archetype": arch['id'],
                        "Layout": layout,
                        "Location": loc['city'],
                        "Zone": loc['zone'],
                        "HVAC": hvac,
                        "Status": status,
                        "Last Updated": datetime.datetime.now().strftime("%Y-%m-%d %H:%M")
                    })
                    batch_id += 1
    st.session_state.data = pd.DataFrame(rows)

# --- HELPER FUNCTIONS ---
def get_stats(df):
    total = len(df)
    completed = len(df[df['Status'] == 'COMPLETED'])
    failed = len(df[df['Status'] == 'FAILED'])
    running = len(df[df['Status'] == 'RUNNING'])
    pending = total - completed - failed - running
    progress = (completed / total) * 100 if total > 0 else 0
    return total, completed, failed, running, pending, progress

# --- UI LAYOUT ---
st.title("🏢 ParametricPlan.ai")
st.markdown("### IESVE Simulation Progress Tracker")

# Sidebar Navigation
with st.sidebar:
    st.header("Navigation")
    page = st.radio("Go to", ["Dashboard", "Matrix Manager", "AI Advisor"])
    
    st.divider()
    st.info("💡 **Tip:** This app tracks batch simulations. Each row represents 81 micro-permutations.")

# --- PAGE: DASHBOARD ---
if page == "Dashboard":
    df = st.session_state.data
    total, completed, failed, running, pending, progress = get_stats(df)
    
    # 1. Top Metrics Row
    c1, c2, c3, c4 = st.columns(4)
    c1.metric("Global Progress", f"{progress:.1f}%", f"{completed}/{total} Batches")
    c2.metric("Active Simulations", running, delta_color="off")
    c3.metric("Critical Failures", failed, delta_color="inverse")
    c4.metric("Total Permutations", f"{(total * PERMUTATIONS_PER_BATCH):,}", "Micro-cases")
    
    st.divider()
    
    # 2. Charts Row
    col_chart1, col_chart2 = st.columns([1, 1])
    
    with col_chart1:
        st.subheader("Status Distribution")
        # Prepare data for Plotly
        status_counts = df['Status'].value_counts().reset_index()
        status_counts.columns = ['Status', 'Count']
        
        color_map = {
            "COMPLETED": "#22c55e", 
            "RUNNING": "#3b82f6", 
            "PENDING": "#e2e8f0", 
            "FAILED": "#ef4444"
        }
        
        fig_pie = px.pie(status_counts, values='Count', names='Status', 
                         color='Status', color_discrete_map=color_map, hole=0.4)
        st.plotly_chart(fig_pie, use_container_width=True)

    with col_chart2:
        st.subheader("Progress by Archetype")
        # Group by Archetype and Status
        arch_stats = df.groupby(['Archetype', 'Status']).size().reset_index(name='Count')
        fig_bar = px.bar(arch_stats, x="Archetype", y="Count", color="Status", 
                         color_discrete_map=color_map, barmode="stack")
        st.plotly_chart(fig_bar, use_container_width=True)

# --- PAGE: MATRIX MANAGER ---
elif page == "Matrix Manager":
    st.subheader("📋 Simulation Matrix")
    
    # Filters
    c_filter1, c_filter2, c_filter3 = st.columns(3)
    filter_arch = c_filter1.selectbox("Filter Archetype", ["All"] + [a['id'] for a in ARCHETYPES])
    filter_stat = c_filter2.selectbox("Filter Status", ["All", "PENDING", "RUNNING", "COMPLETED", "FAILED"])
    
    # Apply Filters
    df_view = st.session_state.data.copy()
    if filter_arch != "All":
        df_view = df_view[df_view['Archetype'] == filter_arch]
    if filter_stat != "All":
        df_view = df_view[df_view['Status'] == filter_stat]
        
    # Editable Dataframe
    st.info("📝 You can edit the **Status** directly in the table below. Changes save automatically.")
    
    edited_df = st.data_editor(
        df_view,
        column_config={
            "Status": st.column_config.SelectboxColumn(
                "Status",
                help="Current simulation state",
                width="medium",
                options=["PENDING", "QUEUED", "RUNNING", "COMPLETED", "FAILED"],
                required=True,
            )
        },
        disabled=["Batch ID", "Archetype", "Layout", "Location", "HVAC", "Zone"],
        hide_index=True,
        use_container_width=True,
        key="editor"
    )
    
    # Update Session State based on edits
    # (In a real DB scenario, you would perform an SQL UPDATE here)
    if not df_view.equals(edited_df):
        # Update the master dataframe with changes from the view
        st.session_state.data.update(edited_df)
        st.success("Changes saved!")


# --- PAGE: AI ADVISOR ---
elif page == "AI Advisor":
    st.subheader("🤖 Gemini QC Advisor")
    
    # API Key Handling
    api_key = st.secrets.get("GEMINI_API_KEY", None)
    
    if not api_key:
        st.warning("⚠️ GEMINI_API_KEY not found in secrets. Please add it to .streamlit/secrets.toml")
        st.markdown("""
        **How to add your key:**
        1. Create a folder `.streamlit` in your project root.
        2. Create a file `secrets.toml`.
        3. Add: `GEMINI_API_KEY = "your-key-here"`
        """)
    else:
        genai.configure(api_key=api_key)
        
        col_stats, col_chat = st.columns([1, 2])
        
        with col_stats:
            st.markdown("#### Context Analysis")
            df = st.session_state.data
            failed_count = len(df[df['Status'] == 'FAILED'])
            
            st.markdown(f"""
            **Current Snapshot:**
            - **Total Batches:** {len(df)}
            - **Failed:** {failed_count}
            - **Completion:** {get_stats(df)[5]:.1f}%
            """)
            
            if st.button("Analyze Failures"):
                if failed_count == 0:
                    st.success("No failures detected! Great job.")
                else:
                    failures = df[df['Status'] == 'FAILED'].head(10).to_string()
                    prompt = f"""
                    You are a Building Energy Simulation QC expert.
                    Analyze these failed simulation batches and suggest potential root causes (e.g., HVAC sizing issues in specific climates).
                    
                    Failed Batches Sample:
                    {failures}
                    """
                    
                    with st.spinner("Gemini is analyzing log patterns..."):
                        try:
                            model = genai.GenerativeModel("gemini-2.0-flash")
                            response = model.generate_content(prompt)
                            st.session_state['ai_response'] = response.text
                        except Exception as e:
                            st.error(f"Error calling Gemini: {e}")

        with col_chat:
            if 'ai_response' in st.session_state:
                st.info(st.session_state['ai_response'])
            else:
                st.markdown("Run an analysis to see insights here.")