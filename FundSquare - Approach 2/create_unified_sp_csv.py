"""
Service Provider Unified CSV Creator
Creates ONE CSV file with service providers as rows and categories as columns
"""

import pandas as pd
import os
from datetime import datetime

def create_unified_service_providers_csv():
    """Create a single CSV with all service providers in columns by category"""
    
    # Read the structured data
    input_file = "output/service_providers_master_structured.csv"
    if not os.path.exists(input_file):
        print("❌ Structured service providers file not found!")
        return False
    
    df = pd.read_csv(input_file)
    print(f"📊 Loaded {len(df)} service provider entries")
    
    # Get unique service provider types
    sp_types = df['Service_Provider_Type'].unique()
    print(f"📋 Found {len(sp_types)} service provider types:")
    for sp_type in sp_types:
        count = len(df[df['Service_Provider_Type'] == sp_type])
        print(f"   • {sp_type}: {count} entries")
    
    # Create unified structure - find the maximum number of entries in any category
    max_entries = df['Service_Provider_Type'].value_counts().max()
    print(f"\n📏 Maximum entries in any category: {max_entries}")
    
    # Create the unified DataFrame
    unified_data = {}
    
    # Add basic information columns first
    unified_data['Row_Number'] = range(1, max_entries + 1)
    
    # For each service provider type, create columns
    for sp_type in sorted(sp_types):
        category_data = df[df['Service_Provider_Type'] == sp_type].reset_index(drop=True)
        
        # Create columns for this category
        id_col = f"{sp_type}_ID"
        name_col = f"{sp_type}_Name"
        country_col = f"{sp_type}_Country"
        
        # Initialize with empty values
        ids = [''] * max_entries
        names = [''] * max_entries
        countries = [''] * max_entries
        
        # Fill with actual data
        for i, row in category_data.iterrows():
            if i < max_entries:
                ids[i] = row['ID']
                names[i] = row['Company_Name']
                countries[i] = row['Country'] if pd.notna(row['Country']) else ''
        
        unified_data[id_col] = ids
        unified_data[name_col] = names
        unified_data[country_col] = countries
    
    # Create the unified DataFrame
    unified_df = pd.DataFrame(unified_data)
    
    # Remove Row_Number column as it's just for alignment
    unified_df = unified_df.drop('Row_Number', axis=1)
    
    # Save the unified CSV
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    output_file = f"output/service_providers_unified_{timestamp}.csv"
    unified_df.to_csv(output_file, index=False)
    
    print(f"\n✅ Created unified service providers CSV: {output_file}")
    print(f"📏 Dimensions: {len(unified_df)} rows × {len(unified_df.columns)} columns")
    print(f"📋 Columns created:")
    
    # Show column structure
    for sp_type in sorted(sp_types):
        print(f"   • {sp_type}:")
        print(f"     - {sp_type}_ID")
        print(f"     - {sp_type}_Name") 
        print(f"     - {sp_type}_Country")
    
    # Also create a master file
    master_file = "output/service_providers_unified_master.csv"
    unified_df.to_csv(master_file, index=False)
    print(f"\n💾 Also saved as master file: {master_file}")
    
    return True

def create_simplified_unified_csv():
    """Create a simpler version with just ID and Name columns per category"""
    
    # Read the structured data
    input_file = "output/service_providers_master_structured.csv"
    if not os.path.exists(input_file):
        print("❌ Structured service providers file not found!")
        return False
    
    df = pd.read_csv(input_file)
    
    # Get unique service provider types (only the main ones)
    main_types = [
        'Central Administrations',
        'Custodians', 
        'Transfer Agents',
        'Auditors',
        'Promoters Marketers'
    ]
    
    # Filter to main types only
    df_main = df[df['Service_Provider_Type'].isin(main_types)]
    
    # Find max entries
    max_entries = df_main['Service_Provider_Type'].value_counts().max()
    print(f"📏 Maximum entries for main service providers: {max_entries}")
    
    # Create simplified unified structure
    simplified_data = {}
    
    for sp_type in main_types:
        category_data = df_main[df_main['Service_Provider_Type'] == sp_type].reset_index(drop=True)
        
        # Create simplified columns (just ID and Name)
        id_col = f"{sp_type.replace(' ', '_')}_ID"
        name_col = f"{sp_type.replace(' ', '_')}_Name"
        
        # Initialize with empty values
        ids = [''] * max_entries
        names = [''] * max_entries
        
        # Fill with actual data
        for i, row in category_data.iterrows():
            if i < max_entries:
                ids[i] = row['ID']
                names[i] = row['Company_Name']
        
        simplified_data[id_col] = ids
        simplified_data[name_col] = names
    
    # Create simplified DataFrame
    simplified_df = pd.DataFrame(simplified_data)
    
    # Save simplified version
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    simplified_file = f"output/service_providers_simplified_{timestamp}.csv"
    simplified_df.to_csv(simplified_file, index=False)
    
    print(f"\n✅ Created simplified unified CSV: {simplified_file}")
    print(f"📏 Dimensions: {len(simplified_df)} rows × {len(simplified_df.columns)} columns")
    
    # Also create master simplified file
    simplified_master = "output/service_providers_simplified_master.csv"
    simplified_df.to_csv(simplified_master, index=False)
    print(f"💾 Also saved as: {simplified_master}")
    
    return True

if __name__ == "__main__":
    print("🔄 Service Provider Unified CSV Creator")
    print("=" * 50)
    
    print("\nThis will create:")
    print("• ONE CSV file with all service providers")
    print("• Service provider types as separate columns")
    print("• Each type has ID, Name, and Country columns")
    print("• All data in a single, easy-to-use file")
    
    print("\nChoose format:")
    print("1. Full version (all categories with ID, Name, Country columns)")
    print("2. Simplified version (main service providers with ID, Name only)")
    print("3. Both versions")
    
    choice = input("\nEnter choice (1-3): ").strip()
    
    if choice == "1":
        success = create_unified_service_providers_csv()
    elif choice == "2":
        success = create_simplified_unified_csv()
    elif choice == "3":
        print("\n📊 Creating full version...")
        success1 = create_unified_service_providers_csv()
        print("\n📊 Creating simplified version...")
        success2 = create_simplified_unified_csv()
        success = success1 and success2
    else:
        print("❌ Invalid choice!")
        success = False
    
    if success:
        print("\n🎉 Unified service provider CSV(s) created successfully!")
        print("\nNow you have:")
        print("• Single CSV file with all service providers in columns")
        print("• Easy to browse and reference")
        print("• Perfect for systematic fund discovery")
    else:
        print("\n❌ Failed to create unified CSV!")
