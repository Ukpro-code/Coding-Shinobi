"""
Service Provider Data Restructuring
Reorganizes the extracted data into better column structure
"""

import pandas as pd
import os
from datetime import datetime

def restructure_service_providers():
    """Restructure service provider data into better format"""
    
    # Read the current data
    input_file = "output/service_providers_master.csv"
    if not os.path.exists(input_file):
        print("❌ Service providers master file not found!")
        return False
    
    df = pd.read_csv(input_file)
    print(f"📊 Loaded {len(df)} service provider entries")
    
    # Define better category mappings
    category_mappings = {
        'Idpays': {
            'name': 'Jurisdictions',
            'description': 'Countries and jurisdictions where funds are domiciled'
        },
        'Promid': {
            'name': 'Promoters_Marketers',
            'description': 'Fund promoters and marketing companies'
        },
        'Fondsid': {
            'name': 'Funds',
            'description': 'Available funds (dynamic based on other selections)'
        },
        'Compartiment': {
            'name': 'Sub_Funds',
            'description': 'Sub-funds and compartments'
        },
        'Cdtypevar': {
            'name': 'Performance_Periods',
            'description': 'Time periods for performance calculation'
        },
        'Cdperf': {
            'name': 'Return_Ranges',
            'description': 'Performance return ranges'
        },
        'Adminid': {
            'name': 'Central_Administrations',
            'description': 'Central administration service providers'
        },
        'Bqedepid': {
            'name': 'Custodians',
            'description': 'Custodian banks and depositaries'
        },
        'Tenregid': {
            'name': 'Transfer_Agents',
            'description': 'Transfer agent service providers'
        },
        'Reventrid': {
            'name': 'Auditors',
            'description': 'Audit firms and auditors'
        },
        'Structlegid': {
            'name': 'Legal_Structures',
            'description': 'Legal structure types (SICAV, FCP, etc.)'
        }
    }
    
    # Create separate DataFrames for each category
    separated_data = {}
    
    print("\n📋 Restructuring by category:")
    for category, info in category_mappings.items():
        category_data = df[df['Category'] == category].copy()
        
        if not category_data.empty:
            # Clean up the data
            category_data = category_data[category_data['Value'] != '-1']  # Remove "All" options
            category_data = category_data.reset_index(drop=True)
            
            separated_data[info['name']] = {
                'data': category_data,
                'description': info['description'],
                'count': len(category_data)
            }
            
            print(f"  ✅ {info['name']}: {len(category_data)} entries")
        else:
            print(f"  ❌ {info['name']}: No data found")
    
    # Create comprehensive Excel file with multiple sheets
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    excel_filename = f"output/service_providers_structured_{timestamp}.xlsx"
    
    with pd.ExcelWriter(excel_filename, engine='openpyxl') as writer:
        # Summary sheet
        summary_data = []
        for name, info in separated_data.items():
            summary_data.append({
                'Service_Provider_Type': name,
                'Description': info['description'],
                'Count': info['count'],
                'Sample_Entries': ', '.join(info['data']['Text'].head(3).tolist()) if not info['data'].empty else 'No entries'
            })
        
        summary_df = pd.DataFrame(summary_data)
        summary_df.to_excel(writer, sheet_name='Summary', index=False)
        
        # Individual sheets for each category
        for name, info in separated_data.items():
            if not info['data'].empty:
                # Create clean DataFrame for this category
                clean_df = pd.DataFrame({
                    'ID': info['data']['Value'],
                    'Name': info['data']['Text'],
                    'Type': name.replace('_', ' ')
                })
                clean_df.to_excel(writer, sheet_name=name[:31], index=False)  # Excel sheet name limit
    
    print(f"\n📁 Created structured Excel file: {excel_filename}")
    
    # Create separate CSV files for each major service provider category
    sp_categories = ['Central_Administrations', 'Custodians', 'Transfer_Agents', 'Auditors', 'Promoters_Marketers']
    
    print(f"\n📄 Creating separate CSV files for key service providers:")
    
    for category in sp_categories:
        if category in separated_data and not separated_data[category]['data'].empty:
            csv_filename = f"output/{category.lower()}_{timestamp}.csv"
            
            # Create enhanced CSV with additional columns
            country_series = separated_data[category]['data']['Text'].str.extract(r'\(([A-Z]{2})\)$')[0].fillna('Unknown')
            
            enhanced_df = pd.DataFrame({
                'ID': separated_data[category]['data']['Value'],
                'Company_Name': separated_data[category]['data']['Text'],
                'Service_Type': category.replace('_', ' '),
                'Country': country_series,
                'Search_Value': separated_data[category]['data']['Value'],
                'Original_Category': separated_data[category]['data']['Category']
            })
            
            enhanced_df.to_csv(csv_filename, index=False)
            print(f"  📊 {category}: {len(enhanced_df)} entries → {csv_filename}")
    
    # Create master structured file
    master_structured = f"output/service_providers_master_structured.csv"
    
    # Combine all into one structured format
    all_structured = []
    for name, info in separated_data.items():
        if not info['data'].empty:
            for _, row in info['data'].iterrows():
                # Extract country if available
                country = ''
                if '(' in row['Text'] and ')' in row['Text']:
                    country_match = row['Text'].split('(')[-1].replace(')', '').strip()
                    if len(country_match) == 2:
                        country = country_match
                
                # Clean company name
                company_name = row['Text']
                if country:
                    company_name = company_name.replace(f'({country})', '').strip()
                
                all_structured.append({
                    'Service_Provider_Type': name.replace('_', ' '),
                    'Company_Name': company_name,
                    'Country': country,
                    'Full_Name': row['Text'],
                    'ID': row['Value'],
                    'Original_Category': row['Category'],
                    'Search_Friendly_Type': name
                })
    
    structured_df = pd.DataFrame(all_structured)
    structured_df.to_csv(master_structured, index=False)
    
    print(f"\n💾 Created master structured file: {master_structured}")
    
    # Create analysis summary
    print(f"\n📈 SERVICE PROVIDER ANALYSIS SUMMARY:")
    print("=" * 60)
    
    for name, info in separated_data.items():
        if info['count'] > 0:
            print(f"\n🏢 {name.replace('_', ' ')}:")
            print(f"   Count: {info['count']}")
            print(f"   Description: {info['description']}")
            
            # Show top entries
            if not info['data'].empty:
                top_entries = info['data']['Text'].head(3).tolist()
                print(f"   Sample: {', '.join(top_entries)}")
    
    # Create country analysis for service providers
    if 'Central_Administrations' in separated_data:
        print(f"\n🌍 COUNTRY DISTRIBUTION (Central Administrations):")
        ca_data = separated_data['Central_Administrations']['data']
        countries = ca_data['Text'].str.extract(r'\(([A-Z]{2})\)$')[0].value_counts().head(10)
        
        for country, count in countries.items():
            if pd.notna(country):
                print(f"   {country}: {count} providers")
    
    return True

if __name__ == "__main__":
    print("🔧 Service Provider Data Restructuring")
    print("=" * 50)
    
    print("\nThis tool will:")
    print("• Reorganize service provider data into logical categories")
    print("• Create separate files for each service provider type")
    print("• Extract country information where available")
    print("• Generate structured Excel and CSV files")
    print("• Provide analysis summary")
    
    confirm = input("\nProceed with restructuring? (y/N): ").strip().lower()
    
    if confirm == 'y':
        success = restructure_service_providers()
        if success:
            print("\n✅ Service provider data restructuring completed successfully!")
            print("\n📁 Files created:")
            print("  • service_providers_structured_[timestamp].xlsx - Multi-sheet Excel file")
            print("  • service_providers_master_structured.csv - Master structured CSV")
            print("  • Individual CSV files for each service provider type")
        else:
            print("\n❌ Restructuring failed!")
    else:
        print("❌ Restructuring cancelled.")
