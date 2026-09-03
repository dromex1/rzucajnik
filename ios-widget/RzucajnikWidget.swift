import WidgetKit
import SwiftUI

// MARK: - Shared Data

struct RzucajnikData {
    let quitDate: Date
    let dailyCost: Double
    let name: String
    
    var elapsed: TimeInterval {
        Date().timeIntervalSince(quitDate)
    }
    
    var days: Int {
        Int(elapsed / 86400)
    }
    
    var hours: Int {
        Int(elapsed.truncatingRemainder(dividingBy: 86400) / 3600)
    }
    
    var minutes: Int {
        Int(elapsed.truncatingRemainder(dividingBy: 3600) / 60)
    }
    
    var moneySaved: Double {
        (elapsed / 86400.0) * dailyCost
    }
    
    static func load() -> RzucajnikData? {
        // Read from UserDefaults shared with the main app (App Group)
        guard let defaults = UserDefaults(suiteName: "group.com.rzucajnik.app") else { return nil }
        guard let quitDateStr = defaults.string(forKey: "rzucajnik_quit_date"),
              let quitDate = ISO8601DateFormatter().date(from: quitDateStr) else { return nil }
        
        let dailyCost = defaults.double(forKey: "rzucajnik_daily_cost")
        let name = defaults.string(forKey: "rzucajnik_name") ?? "Bohater"
        
        return RzucajnikData(
            quitDate: quitDate,
            dailyCost: dailyCost > 0 ? dailyCost : 15.0,
            name: name
        )
    }
    
    static var placeholder: RzucajnikData {
        RzucajnikData(quitDate: Date().addingTimeInterval(-86400 * 7), dailyCost: 15.0, name: "Bohater")
    }
}

// MARK: - Timeline Provider

struct RzucajnikProvider: TimelineProvider {
    func placeholder(in context: Context) -> RzucajnikEntry {
        RzucajnikEntry(date: Date(), data: .placeholder)
    }
    
    func getSnapshot(in context: Context, completion: @escaping (RzucajnikEntry) -> Void) {
        let data = RzucajnikData.load() ?? .placeholder
        completion(RzucajnikEntry(date: Date(), data: data))
    }
    
    func getTimeline(in context: Context, completion: @escaping (Timeline<RzucajnikEntry>) -> Void) {
        let data = RzucajnikData.load() ?? .placeholder
        let currentDate = Date()
        
        // Update every minute for a ticking feel
        var entries: [RzucajnikEntry] = []
        for minuteOffset in 0..<60 {
            let entryDate = Calendar.current.date(byAdding: .minute, value: minuteOffset, to: currentDate)!
            entries.append(RzucajnikEntry(date: entryDate, data: data))
        }
        
        let timeline = Timeline(entries: entries, policy: .atEnd)
        completion(timeline)
    }
}

struct RzucajnikEntry: TimelineEntry {
    let date: Date
    let data: RzucajnikData
}

// MARK: - Widget Views

struct RzucajnikWidgetSmallView: View {
    let entry: RzucajnikEntry
    
    var body: some View {
        let data = entry.data
        
        ZStack {
            // Gradient background
            LinearGradient(
                gradient: Gradient(colors: [
                    Color(red: 0.4, green: 0.49, blue: 0.92),
                    Color(red: 0.46, green: 0.29, blue: 0.64)
                ]),
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            
            VStack(alignment: .leading, spacing: 6) {
                // Title
                Text("Rzucajnik")
                    .font(.system(size: 12, weight: .bold))
                    .foregroundColor(.white.opacity(0.8))
                    .textCase(.uppercase)
                    .tracking(1.5)
                
                Spacer()
                
                // Days counter
                HStack(alignment: .firstTextBaseline, spacing: 2) {
                    Text("\(data.days)")
                        .font(.system(size: 36, weight: .black, design: .rounded))
                        .foregroundColor(.white)
                    Text("dni")
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundColor(.white.opacity(0.7))
                }
                
                // Time
                Text("\(String(format: "%02d", data.hours))h \(String(format: "%02d", data.minutes))m")
                    .font(.system(size: 14, weight: .semibold, design: .monospaced))
                    .foregroundColor(.white.opacity(0.8))
                
                Spacer()
                
                // Money saved
                HStack(spacing: 4) {
                    Image(systemName: "banknote")
                        .font(.system(size: 11))
                        .foregroundColor(.white.opacity(0.7))
                    Text(String(format: "%.2f zł", data.moneySaved))
                        .font(.system(size: 13, weight: .bold, design: .monospaced))
                        .foregroundColor(.white)
                }
            }
            .padding(16)
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
        }
    }
}

struct RzucajnikWidgetMediumView: View {
    let entry: RzucajnikEntry
    
    var body: some View {
        let data = entry.data
        
        ZStack {
            LinearGradient(
                gradient: Gradient(colors: [
                    Color(red: 0.4, green: 0.49, blue: 0.92),
                    Color(red: 0.46, green: 0.29, blue: 0.64)
                ]),
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            
            HStack(spacing: 16) {
                // Left: Timer
                VStack(alignment: .leading, spacing: 6) {
                    Text("Nie palisz już")
                        .font(.system(size: 11, weight: .bold))
                        .foregroundColor(.white.opacity(0.7))
                        .textCase(.uppercase)
                        .tracking(1.5)
                    
                    HStack(alignment: .firstTextBaseline, spacing: 2) {
                        Text("\(data.days)")
                            .font(.system(size: 42, weight: .black, design: .rounded))
                            .foregroundColor(.white)
                        Text("dni")
                            .font(.system(size: 16, weight: .semibold))
                            .foregroundColor(.white.opacity(0.7))
                    }
                    
                    Text("\(String(format: "%02d", data.hours)):\(String(format: "%02d", data.minutes))")
                        .font(.system(size: 16, weight: .bold, design: .monospaced))
                        .foregroundColor(.white.opacity(0.8))
                }
                
                Spacer()
                
                // Right: Stats
                VStack(alignment: .trailing, spacing: 12) {
                    // Money
                    VStack(alignment: .trailing, spacing: 2) {
                        HStack(spacing: 4) {
                            Image(systemName: "banknote")
                                .font(.system(size: 12))
                                .foregroundColor(.white.opacity(0.6))
                            Text("Zaoszczędzone")
                                .font(.system(size: 10, weight: .semibold))
                                .foregroundColor(.white.opacity(0.6))
                        }
                        Text(String(format: "%.2f zł", data.moneySaved))
                            .font(.system(size: 18, weight: .black, design: .monospaced))
                            .foregroundColor(.white)
                    }
                    
                    // Greeting
                    VStack(alignment: .trailing, spacing: 2) {
                        Text("Cześć, \(data.name)")
                            .font(.system(size: 12, weight: .semibold))
                            .foregroundColor(.white.opacity(0.8))
                        Text("Dzień \(data.days + 1) bez palenia")
                            .font(.system(size: 11, weight: .medium))
                            .foregroundColor(.white.opacity(0.6))
                    }
                }
            }
            .padding(16)
        }
    }
}

// MARK: - Widget Configuration

@main
struct RzucajnikWidget: Widget {
    let kind: String = "RzucajnikWidget"
    
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: RzucajnikProvider()) { entry in
            if #available(iOS 17.0, *) {
                RzucajnikWidgetView(entry: entry)
                    .containerBackground(for: .widget) {
                        LinearGradient(
                            gradient: Gradient(colors: [
                                Color(red: 0.4, green: 0.49, blue: 0.92),
                                Color(red: 0.46, green: 0.29, blue: 0.64)
                            ]),
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    }
            } else {
                RzucajnikWidgetView(entry: entry)
            }
        }
        .configurationDisplayName("Rzucajnik")
        .description("Śledź postępy w rzucaniu palenia.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}

struct RzucajnikWidgetView: View {
    @Environment(\.widgetFamily) var family
    let entry: RzucajnikEntry
    
    var body: some View {
        switch family {
        case .systemSmall:
            RzucajnikWidgetSmallView(entry: entry)
        case .systemMedium:
            RzucajnikWidgetMediumView(entry: entry)
        default:
            RzucajnikWidgetSmallView(entry: entry)
        }
    }
}

// MARK: - Previews

#Preview("Small", as: .systemSmall) {
    RzucajnikWidget()
} timeline: {
    RzucajnikEntry(date: Date(), data: .placeholder)
}

#Preview("Medium", as: .systemMedium) {
    RzucajnikWidget()
} timeline: {
    RzucajnikEntry(date: Date(), data: .placeholder)
}
